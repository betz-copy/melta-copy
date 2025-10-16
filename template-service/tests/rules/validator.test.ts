import { ActionOnFail } from '@microservices/shared';
import { EntityTemplateManagerService } from '../../src/express/externalServices/entityTemplateManager';
import { RelationshipTemplateManager } from '../../src/express/relationshipTemplate/manager';
import { IRelationshipTemplateRule } from '../../src/express/rule/interfaces';
import { validateRuleFormula } from '../../src/express/rule/validator';
import { createRuleRequestSchema } from '../../src/express/rule/validator.schema';
import { defaultValidationOptions } from '../../src/utils/joi';
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

const mockGetEntityTemplateByIdWithRuleExamples: typeof EntityTemplateManagerService.getEntityTemplateById = async (id) => {
    if (id === travelAgentEntityTemplate._id) {
        return travelAgentEntityTemplate;
    }
    if (id === flightEntityTemplate._id) {
        return flightEntityTemplate;
    }
    if (id === tripEntityTemplate._id) {
        return tripEntityTemplate;
    }

    throw new Error(`unexpected entity template id "${id}"`);
};

const mockGetRelationshipTemplateByIdWithRuleExamples: typeof RelationshipTemplateManager.getTemplateById = async (id) => {
    if (id === flightsOnRelationshipTemplate._id) {
        return flightsOnRelationshipTemplate;
    }
    if (id === tripConnectedToFlightRelationshipTemplate._id) {
        return tripConnectedToFlightRelationshipTemplate;
    }

    throw new Error(`unexpected relationship template id "${id}"`);
};

const mockSearchRelationshipTemplatesWithSimpleBody: typeof RelationshipTemplateManager.searchTemplates = async (searchBody) => {
    const allRelationshipsExamples = [flightsOnRelationshipTemplate, tripConnectedToFlightRelationshipTemplate];
    const isSimpleSearchTemplatesOfAsSource = searchBody.sourceEntityIds?.length === 1;
    const isSimpleSearchTemplatesOfAsDestination = searchBody.destinationEntityIds?.length === 1;

    if (isSimpleSearchTemplatesOfAsSource && !isSimpleSearchTemplatesOfAsDestination) {
        return allRelationshipsExamples.filter((relationshipTemplate) => searchBody.sourceEntityIds![0] === relationshipTemplate.sourceEntityId);
    }

    if (isSimpleSearchTemplatesOfAsDestination && !isSimpleSearchTemplatesOfAsSource) {
        return allRelationshipsExamples.filter(
            (relationshipTemplate) => searchBody.destinationEntityIds![0] === relationshipTemplate.destinationEntityId,
        );
    }

    throw new Error('expect for mock that search rel templates is of "simple" form of only source ids or only destinations ids');
};

describe('logic of validator of rules', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    it.each([oneTravelAgentPerFlight, noOverlappingFlightsInTrip, warnOnEveryFlightOnActiveZone])(
        'should verify good rule named "$name"',
        async (rule) => {
            createRuleRequestSchema.validate(rule, defaultValidationOptions);

            const getRelationshipTepmlateByIdSpy = jest.spyOn(RelationshipTemplateManager, 'getTemplateById');
            getRelationshipTepmlateByIdSpy.mockImplementation(mockGetRelationshipTemplateByIdWithRuleExamples);

            const getEntityTemplateByIdSpy = jest.spyOn(EntityTemplateManagerService, 'getEntityTemplateById');
            getEntityTemplateByIdSpy.mockImplementation(mockGetEntityTemplateByIdWithRuleExamples);

            const searchEntityTemplatesSpy = jest.spyOn(RelationshipTemplateManager, 'searchTemplates');
            searchEntityTemplatesSpy.mockImplementation(mockSearchRelationshipTemplatesWithSimpleBody);

            await validateRuleFormula(rule);
        },
    );

    it('should fail rule with non existing relationship template', async () => {
        const ruleWithUnknownRelationship: IRelationshipTemplateRule = {
            name: 'myname',
            description: 'mydescription',
            actionOnFail: ActionOnFail.WARNING,
            relationshipTemplateId: flightsOnRelationshipTemplate._id,
            entityTemplateId: tripEntityTemplate._id, // trip doesnt exist in rel
            formula: {
                isEquation: true,
                operatorBool: 'equals',
                lhsArgument: { isConstant: true, value: 0 },
                rhsArgument: { isConstant: true, value: 0 },
            },
            disabled: false,
        };

        createRuleRequestSchema.validate(ruleWithUnknownRelationship, defaultValidationOptions);

        const getRelationshipTepmlateByIdSpy = jest.spyOn(RelationshipTemplateManager, 'getTemplateById');
        getRelationshipTepmlateByIdSpy.mockImplementation(mockGetRelationshipTemplateByIdWithRuleExamples);

        const getEntityTemplateByIdSpy = jest.spyOn(EntityTemplateManagerService, 'getEntityTemplateById');
        getEntityTemplateByIdSpy.mockImplementation(mockGetEntityTemplateByIdWithRuleExamples);

        const searchEntityTemplatesSpy = jest.spyOn(RelationshipTemplateManager, 'searchTemplates');
        searchEntityTemplatesSpy.mockImplementation(mockSearchRelationshipTemplatesWithSimpleBody);

        const validationResultPromise = validateRuleFormula(ruleWithUnknownRelationship);

        await expect(validationResultPromise).rejects.toThrow();
    });
});
