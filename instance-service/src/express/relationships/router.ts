import { Router } from 'express';
import { wrapController, wrapMiddleware } from '../../utils/express';
import {
    getRelationshipByIdRequestSchema,
    createRelationshipRequestSchema,
    deleteRelationshipByIdRequestSchema,
    updateRelationshipByIdRequestSchema,
    getRelationshipsCountRequestSchema,
    runBulkOfActionsInMultipleTransactionsSchema,
    getRelationshipsByIdsRequestSchema,
} from './validator.schema';
import ValidateRequest from '../../utils/joi';
import RelationshipController from './controller';
import { validateRelationship } from './validator.template';

const relationshipRouter: Router = Router();

relationshipRouter.post('/ids', ValidateRequest(getRelationshipsByIdsRequestSchema), wrapController(RelationshipController.getRelationshipsByIds));
relationshipRouter.get(
    '/count',
    ValidateRequest(getRelationshipsCountRequestSchema),
    wrapController(RelationshipController.getRelationshipsCountByTemplateId),
);
relationshipRouter.get('/:id', ValidateRequest(getRelationshipByIdRequestSchema), wrapController(RelationshipController.getRelationshipById));

relationshipRouter.post(
    '/bulk',
    ValidateRequest(runBulkOfActionsInMultipleTransactionsSchema),
    wrapController(RelationshipController.runBulkOfActionsInMultipleTransactions),
);

relationshipRouter.post(
    '/',
    ValidateRequest(createRelationshipRequestSchema),
    wrapMiddleware(validateRelationship),
    wrapController(RelationshipController.createRelationship),
);
relationshipRouter.delete(
    '/:id',
    ValidateRequest(deleteRelationshipByIdRequestSchema),
    wrapController(RelationshipController.deleteRelationshipById),
);
relationshipRouter.put(
    '/:id',
    ValidateRequest(updateRelationshipByIdRequestSchema),
    wrapController(RelationshipController.updateRelationshipPropertiesById),
);

export default relationshipRouter;
