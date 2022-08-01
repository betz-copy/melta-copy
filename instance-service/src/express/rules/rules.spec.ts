import { IRelationshipTemplateRule } from './interfaces';

const mockFlightTemplateId = '1';
const mockPersonTemplateId = '2';

const onePersonPerFlight: IRelationshipTemplateRule = {
    name: 'onePersonPerFlight',
    description: 'Only one person allowed per flight',
    errorMessageOnFail: 'Flight already has attached person',
    relationshipTemplate: {
        templateId: '123',
        properties: {},
        sourceEntityId: mockFlightTemplateId,
        destinationEntityId: mockPersonTemplateId,
    },
    pinnedEntityTemplateId: mockFlightTemplateId,
    formula:  
};

