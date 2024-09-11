import _difference from 'lodash.difference';
import _groupBy from 'lodash.groupby';
import _isEqual from 'lodash.isequal';
import _mapValues from 'lodash.mapvalues';
import _sortBy from 'lodash.sortby';
import { StatusCodes } from 'http-status-codes';
import config from '../../config';
import { filteredMap } from '../../utils/filteredMap';
import { isEqualStripUndefined } from '../../utils/lib';
import { ServiceError } from '../error';
import { getCausesOfRuleFailure } from './calcNewCausesOfRuleFailure';
import { IBrokenRule, ICausesOfInstance, IRuleFailure } from './interfaces';
import { ICause } from './interfaces/formulaWithCauses/cause';

const getRelationshipIdFormattedForBrokenRules = (actionsResults: { createdRelationshipId?: string; createdEntityId?: string }[], relationshipId) => {
    const index = actionsResults.findIndex((actionResult) => actionResult.createdRelationshipId === relationshipId);

    return index === -1 ? relationshipId : `$${index}._id`;
};

const getEntityIdFormattedForBrokenRules = (actionsResults: { createdRelationshipId?: string; createdEntityId?: string }[], entityId: string) => {
    const index = actionsResults.findIndex((actionResult) => actionResult.createdEntityId === entityId);

    return index === -1 ? entityId : `$${index}._id`;
};

const getCauseFormattedForBrokenRules = (
    cause: ICausesOfInstance,
    actionsResults: { createdRelationshipId?: string; createdEntityId?: string }[],
): ICausesOfInstance => {
    const {
        instance: { entityId, aggregatedRelationship },
        ...restOfCause
    } = cause;

    let formattedAggregatedRelationship: ICause['instance']['aggregatedRelationship'];
    if (aggregatedRelationship) {
        const { relationshipId, otherEntityId } = aggregatedRelationship;
        formattedAggregatedRelationship = {
            relationshipId: getRelationshipIdFormattedForBrokenRules(actionsResults, relationshipId),
            otherEntityId: getEntityIdFormattedForBrokenRules(actionsResults, otherEntityId), // no way createdEntity would be as otherEntityId, but just in case
        };
    }

    return {
        ...restOfCause,
        instance: {
            entityId: getEntityIdFormattedForBrokenRules(actionsResults, entityId),
            aggregatedRelationship: formattedAggregatedRelationship,
        },
    };
};

const getBrokenRuleFormatted = (
    brokenRule: IBrokenRule,
    actionsResults: { createdRelationshipId?: string; createdEntityId?: string }[],
): IBrokenRule => {
    const { ruleId, failures } = brokenRule;

    return {
        ruleId,
        failures: failures.map(({ entityId, causes }) => ({
            entityId: getEntityIdFormattedForBrokenRules(actionsResults, entityId),
            causes: causes.map((cause) => getCauseFormattedForBrokenRules(cause, actionsResults)),
        })),
    };
};

export const sortBrokenRules = (brokenRules: IBrokenRule[]) => {
    const brokenRulesContentSorted: IBrokenRule[] = brokenRules.map(({ ruleId, failures }) => {
        const failuresContentSorted: IBrokenRule['failures'] = failures.map(({ entityId, causes }) => {
            const causesContentSorted = causes.map((cause) => ({ ...cause, properties: cause.properties.sort() }));

            return {
                entityId,
                causes: _sortBy(causesContentSorted, [
                    'instance.entityId',
                    'instance.aggregatedRelationship.relationshipId',
                    'instance.aggregatedRelationship.otherEntityId',
                ]),
            };
        });
        return {
            ruleId,
            failures: _sortBy(failuresContentSorted, 'entityId'),
        };
    });

    return _sortBy(brokenRulesContentSorted, 'ruleId');
};

export const areAllBrokenRulesIgnored = (brokenRules: IBrokenRule[], ignoredRules: IBrokenRule[]) => {
    const brokenRulesSorted = sortBrokenRules(brokenRules);
    const ignoredRulesSorted = sortBrokenRules(ignoredRules);

    return isEqualStripUndefined(brokenRulesSorted, ignoredRulesSorted);
};

export const throwIfActionCausedRuleFailures = (
    ignoredRules: IBrokenRule[],
    ruleFailuresBeforeAction: IRuleFailure[],
    ruleFailuresAfterAction: IRuleFailure[],
    actionsResults: { createdRelationshipId?: string; createdEntityId?: string }[],
) => {
    const ruleFailuresWithNewCauses = filteredMap(ruleFailuresAfterAction, (ruleFailureAfterAction) => {
        const ruleFailureBeforeAction = ruleFailuresBeforeAction.find(({ rule, entityId }) => {
            return rule._id === ruleFailureAfterAction.rule._id && entityId === ruleFailureAfterAction.entityId;
        });

        const causes = getCausesOfRuleFailure(ruleFailureAfterAction, ruleFailureBeforeAction, ruleFailureAfterAction.rule.formula);

        if (causes.length === 0) {
            return undefined;
        }

        return {
            include: true,
            value: { ruleId: ruleFailureAfterAction.rule._id, entityId: ruleFailureAfterAction.entityId, causes },
        };
    });

    const ruleFailuresWithNewCausesPerRuleId = _groupBy(ruleFailuresWithNewCauses, ({ ruleId }) => ruleId);
    const brokenRules: IBrokenRule[] = Object.entries(ruleFailuresWithNewCausesPerRuleId)
        .map(([ruleId, ruleFailuresOfRuleId]) => ({
            ruleId,
            failures: ruleFailuresOfRuleId.map(({ entityId, causes }) => ({ entityId, causes })),
        }))
        .map((brokenRule) => getBrokenRuleFormatted(brokenRule, actionsResults));

    if (!areAllBrokenRulesIgnored(brokenRules, ignoredRules)) {
        throw new ServiceError(StatusCodes.BAD_REQUEST, `[NEO4J] action is blocked by rules.`, {
            errorCode: config.errorCodes.ruleBlock,
            brokenRules,
        });
    }
};
