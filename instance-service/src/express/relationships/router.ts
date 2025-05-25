import { Router } from 'express';
import { createController, ValidateRequest } from '@microservices/shared';
import RelationshipController from './controller';
import {
    createRelationshipRequestSchema,
    deleteRelationshipByIdRequestSchema,
    getRelationshipsByEntitiesAndTemplate,
    getRelationshipByIdRequestSchema,
    getRelationshipsByIdsRequestSchema,
    getRelationshipsCountRequestSchema,
    updateRelationshipByIdRequestSchema,
} from './validator.schema';
import RelationshipValidator from './validator.template';

const relationshipRouter: Router = Router();
const relationshipController = createController(RelationshipController);
const relationshipValidatorController = createController(RelationshipValidator, true);

relationshipRouter.post('/ids', ValidateRequest(getRelationshipsByIdsRequestSchema), relationshipController.getRelationshipsByIds);
relationshipRouter.get('/', ValidateRequest(getRelationshipsByEntitiesAndTemplate), relationshipController.getRelationshipsByEntitiesAndTemplate);
relationshipRouter.get('/count', ValidateRequest(getRelationshipsCountRequestSchema), relationshipController.getRelationshipsCountByTemplateId);
relationshipRouter.get('/:id', ValidateRequest(getRelationshipByIdRequestSchema), relationshipController.getRelationshipById);
relationshipRouter.post(
    '/',
    ValidateRequest(createRelationshipRequestSchema),
    relationshipValidatorController.validateRelationship,
    relationshipController.createRelationship,
);
relationshipRouter.delete('/:id', ValidateRequest(deleteRelationshipByIdRequestSchema), relationshipController.deleteRelationshipById);
relationshipRouter.put('/:id', ValidateRequest(updateRelationshipByIdRequestSchema), relationshipController.updateRelationshipPropertiesById);

export default relationshipRouter;
