import { ActionTypes, IAction, ICreateEntityMetadata, IUpdateEntityMetadata } from '@packages/action';
import { IBrokenRule } from '@packages/rule-breach';
import { environment } from '../globals';

const { entityId: newEntityId } = environment.loadExcel;

export const groupBrokenRulesByEntity = (brokenRules: IBrokenRule[]): IBrokenRule[][] => {
    const entityMap = new Map<string, IBrokenRule[]>();

    for (const brokenRule of brokenRules) {
        for (const failure of brokenRule.failures) {
            const { entityId, causes } = failure;

            if (!entityMap.has(entityId)) entityMap.set(entityId, []);

            const brokenRuleForEntity: IBrokenRule = {
                ruleId: brokenRule.ruleId,
                failures: [{ entityId, causes }],
            };

            entityMap.get(entityId)!.push(brokenRuleForEntity);
        }
    }

    return Array.from(entityMap.values()).map((group) =>
        group.map((brokenRule) => ({
            ...brokenRule,
            failures: brokenRule.failures.map((failure) => {
                const updatedCauses = failure.causes.map((cause) => ({
                    ...cause,
                    instance: {
                        entityId: newEntityId,
                    },
                }));

                return {
                    ...failure,
                    causes: updatedCauses,
                    entityId: newEntityId,
                };
            }),
        })),
    );
};

export const groupActionsByEntityId = (actions: IAction[]): IAction[][] => {
    const entityMap = new Map<string, IAction[]>();

    for (const action of actions) {
        let entityId: string | undefined;

        if (action.actionType === ActionTypes.CreateEntity) entityId = (action.actionMetadata as ICreateEntityMetadata).properties._id;
        else if (action.actionType === ActionTypes.UpdateEntity) entityId = (action.actionMetadata as IUpdateEntityMetadata).entityId;

        if (entityId) {
            if (!entityMap.has(entityId)) entityMap.set(entityId, []);
            entityMap.get(entityId)!.push(action);
        }
    }

    return Array.from(entityMap.values()).map((group) =>
        group.map((action) => {
            if (action.actionType === ActionTypes.CreateEntity)
                return {
                    ...action,
                    actionMetadata: {
                        ...action.actionMetadata,
                        properties: {
                            ...(action.actionMetadata as ICreateEntityMetadata).properties,
                            _id: newEntityId,
                        },
                    },
                };

            if (action.actionType === ActionTypes.UpdateEntity)
                return {
                    ...action,
                    actionMetadata: {
                        ...action.actionMetadata,
                        entityId: newEntityId,
                    },
                };

            return action;
        }),
    );
};
