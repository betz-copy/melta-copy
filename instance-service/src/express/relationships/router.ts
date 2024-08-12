import { Router } from 'express';
import { createController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import RelationshipController from './controller';
import {
    createRelationshipRequestSchema,
    deleteRelationshipByIdRequestSchema,
    getRelationshipByIdRequestSchema,
    getRelationshipsByIdsRequestSchema,
    getRelationshipsCountRequestSchema,
    updateRelationshipByIdRequestSchema,
} from './validator.schema';
import RelationshipValidator from './validator.template';

const relationshipRouter: Router = Router();
const relationshipController = createController(RelationshipController);
const relationshipValidatorController = createController(RelationshipValidator, true);

relationshipRouter.post('/ids', ValidateRequest(getRelationshipsByIdsRequestSchema), wrapController(RelationshipController.getRelationshipsByIds));
relationshipRouter.get(
    '/count',
    ValidateRequest(getRelationshipsCountRequestSchema),
    wrapController(RelationshipController.getRelationshipsCountByTemplateId),
);
relationshipRouter.get('/:id', ValidateRequest(getRelationshipByIdRequestSchema), wrapController(RelationshipController.getRelationshipById));

relationshipRouter.post(
    '/',
    ValidateRequest(createRelationshipRequestSchema),
    relationshipValidatorController('validateRelationship'),
    relationshipController('createRelationship'),
);
relationshipRouter.delete('/:id', ValidateRequest(deleteRelationshipByIdRequestSchema), relationshipController('deleteRelationshipById'));
relationshipRouter.put('/:id', ValidateRequest(updateRelationshipByIdRequestSchema), relationshipController('updateRelationshipPropertiesById'));

export default relationshipRouter;
