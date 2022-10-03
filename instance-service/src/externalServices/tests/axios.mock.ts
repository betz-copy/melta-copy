import MockAdapter from 'axios-mock-adapter';
import { EntityTemplateManagerService } from '../entityTemplateManager';
import { RelationshipsTemplateManagerService } from '../relationshipTemplateManager';

export const getMockAdapterEntityTemplateManager = () => {
    return new MockAdapter(EntityTemplateManagerService.EntityTemplateManagerApi);
};

export const getMockAdapterRelationshipTemplateManager = () => {
    return new MockAdapter(RelationshipsTemplateManagerService.RelationshipsTemplateManagerAxiosApi);
};
