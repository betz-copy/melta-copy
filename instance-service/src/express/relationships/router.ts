import { Router } from 'express';
import { createController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import RelationshipController from './controller';
import {
    createRelationshipRequestSchema,
    deleteRelationshipByIdRequestSchema,
    getRelationshipByIdRequestSchema,
    getRelationshipsConnectionsByIdRequestSchema,
    getRelationshipsCountRequestSchema,
    updateRelationshipByIdRequestSchema,
} from './validator.schema';
import RelationshipValidator from './validator.template';

const relationshipRouter: Router = Router();

const relationshipController = createController(RelationshipController)<RelationshipController>;
const relationshipValidatorController = createController(RelationshipValidator)<RelationshipValidator>;

relationshipRouter.post(
    '/connections',
    ValidateRequest(getRelationshipsConnectionsByIdRequestSchema),
    relationshipController('getRelationshipsConnectionsById'),
);
relationshipRouter.get('/count', ValidateRequest(getRelationshipsCountRequestSchema), relationshipController('getRelationshipsCountByTemplateId'));
relationshipRouter.get('/:id', ValidateRequest(getRelationshipByIdRequestSchema), relationshipController('getRelationshipById'));
relationshipRouter.post(
    '/',
    ValidateRequest(createRelationshipRequestSchema),
    relationshipValidatorController('validateRelationship'),
    relationshipController('createRelationship'),
);
relationshipRouter.delete('/:id', ValidateRequest(deleteRelationshipByIdRequestSchema), relationshipController('deleteRelationshipById'));
relationshipRouter.put('/:id', ValidateRequest(updateRelationshipByIdRequestSchema), relationshipController('updateRelationshipPropertiesById'));

export default relationshipRouter;
