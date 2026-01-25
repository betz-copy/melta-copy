/** biome-ignore-all lint/suspicious/noExplicitAny: tests */
import { ISearchRelationshipTemplatesBody } from '@packages/relationship-template';
import { ActionOnFail, IRule } from '@packages/rule';
import { defaultValidationOptions } from '@packages/utils';
import RuleValidator from '../../src/express/rule/validator';
import { createRuleRequestSchema } from '../../src/express/rule/validator.schema';
import {
    flightEntityTemplate,
    flightsOnRelationshipTemplate,
    noOverlappingFlightsInTrip,
    oneTravelAgentPerFlight,
    travelAgentEntityTemplate,
    tripConnectedToFlightRelationshipTemplate,
    tripEntityTemplate,
    warnOnEveryFlightOnActiveZone,
} from './rules-examples';

const mockGetEntityTemplateByIdWithRuleExamples = async (id: string) => {
    if (id === travelAgentEntityTemplate._id) {
        return travelAgentEntityTemplate as any;
    }
    if (id === flightEntityTemplate._id) {
        return flightEntityTemplate as any;
    }
    if (id === tripEntityTemplate._id) {
        return tripEntityTemplate as any;
    }

    throw new Error(`unexpected entity template id "${id}"`);
};

const mockGetRelationshipTemplateByIdWithRuleExamples = async (id: string) => {
    if (id === flightsOnRelationshipTemplate._id) {
        return flightsOnRelationshipTemplate as any;
    }
    if (id === tripConnectedToFlightRelationshipTemplate._id) {
        return tripConnectedToFlightRelationshipTemplate as any;
    }

    throw new Error(`unexpected relationship template id "${id}"`);
};

const mockSearchRelationshipTemplatesWithSimpleBody = async (searchBody: ISearchRelationshipTemplatesBody) => {
    const allRelationshipsExamples = [flightsOnRelationshipTemplate, tripConnectedToFlightRelationshipTemplate];
    const isSimpleSearchTemplatesOfAsSource = searchBody.sourceEntityIds?.length === 1;
    const isSimpleSearchTemplatesOfAsDestination = searchBody.destinationEntityIds?.length === 1;

    if (isSimpleSearchTemplatesOfAsSource && !isSimpleSearchTemplatesOfAsDestination) {
        return allRelationshipsExamples.filter(
            (relationshipTemplate) => searchBody.sourceEntityIds![0] === relationshipTemplate.sourceEntityId,
        ) as any;
    }

    if (isSimpleSearchTemplatesOfAsDestination && !isSimpleSearchTemplatesOfAsSource) {
        return allRelationshipsExamples.filter(
            (relationshipTemplate) => searchBody.destinationEntityIds![0] === relationshipTemplate.destinationEntityId,
        ) as any;
    }

    throw new Error('expect for mock that search rel templates is of "simple" form of only source ids or only destinations ids');
};

describe('logic of validator of rules', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    it.each([
        oneTravelAgentPerFlight,
        noOverlappingFlightsInTrip,
        warnOnEveryFlightOnActiveZone,
    ])('should verify good rule named "$name"', async (rule) => {
        createRuleRequestSchema.validate(rule, defaultValidationOptions);

        const workspaceId = 'test-workspace';
        const ruleValidator = new RuleValidator(workspaceId);

        const getRelationshipTemplateByIdSpy = jest.spyOn(ruleValidator['manager'], 'getTemplateById');
        getRelationshipTemplateByIdSpy.mockImplementation(mockGetRelationshipTemplateByIdWithRuleExamples);

        const getEntityTemplateByIdSpy = jest.spyOn(ruleValidator['entityTemplateManager'], 'getTemplateById');
        getEntityTemplateByIdSpy.mockImplementation(mockGetEntityTemplateByIdWithRuleExamples);

        const searchTemplatesSpy = jest.spyOn(ruleValidator['manager'], 'searchTemplates');
        searchTemplatesSpy.mockImplementation(mockSearchRelationshipTemplatesWithSimpleBody);

        await ruleValidator['validateRuleFormula'](rule);
    });

    it('should fail rule with non existing relationship template', async () => {
        const ruleWithUnknownRelationship: IRule = {
            name: 'myname',
            description: 'mydescription',
            actionOnFail: ActionOnFail.WARNING,
            entityTemplateId: tripEntityTemplate._id, // trip doesnt exist in rel
            formula: {
                isEquation: true,
                operatorBool: 'equals',
                lhsArgument: { isConstant: true, value: 0, type: 'number' },
                rhsArgument: { isConstant: true, value: 0, type: 'number' },
            },
            disabled: false,
            doesFormulaHaveTodayFunc: false,
        };

        createRuleRequestSchema.validate(ruleWithUnknownRelationship, defaultValidationOptions);

        const workspaceId = 'test-workspace';
        const ruleValidator = new RuleValidator(workspaceId);

        const getRelationshipTemplateByIdSpy = jest.spyOn(ruleValidator['manager'], 'getTemplateById');
        getRelationshipTemplateByIdSpy.mockImplementation(mockGetRelationshipTemplateByIdWithRuleExamples);

        const getEntityTemplateByIdSpy = jest.spyOn(ruleValidator['entityTemplateManager'], 'getTemplateById');
        getEntityTemplateByIdSpy.mockImplementation(mockGetEntityTemplateByIdWithRuleExamples);

        const searchTemplatesSpy = jest.spyOn(ruleValidator['manager'], 'searchTemplates');
        searchTemplatesSpy.mockImplementation(mockSearchRelationshipTemplatesWithSimpleBody);

        const validationResultPromise = ruleValidator['validateRuleFormula'](ruleWithUnknownRelationship);

        await expect(validationResultPromise).rejects.toThrow();
    });
});
