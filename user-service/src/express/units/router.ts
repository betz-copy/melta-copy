import { ValidateRequest, wrapController } from '@microservices/shared';
import { Router } from 'express';
import UnitsController from './controller';
import {
    createUnitRequestSchema,
    getUnitHierarchyRequestSchema,
    getUnitsByIdsRequestSchema,
    getUnitsRequestSchema,
    updateUnitRequestSchema,
} from './validator.schema';

const unitsRouter: Router = Router();

unitsRouter.get('/', ValidateRequest(getUnitsRequestSchema), wrapController(UnitsController.getUnits));

unitsRouter.post('/ids', ValidateRequest(getUnitsByIdsRequestSchema), wrapController(UnitsController.getUnitsByIds));

unitsRouter.post('/', ValidateRequest(createUnitRequestSchema), wrapController(UnitsController.createUser));

unitsRouter.patch('/:id', ValidateRequest(updateUnitRequestSchema), wrapController(UnitsController.updateUnit));

unitsRouter.get('/:workspaceId/hierarchy', ValidateRequest(getUnitHierarchyRequestSchema), wrapController(UnitsController.getUnitHierarchy));

export default unitsRouter;
