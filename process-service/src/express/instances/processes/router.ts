import { Router } from 'express';
import { createController, ValidateRequest } from '@microservices/shared';
import ProcessInstance from './controller';
import {
    archivedProcessRequestSchema,
    createInstanceRequestSchema,
    deleteInstanceByIdRequestSchema,
    getInstanceByIdRequestSchema,
    searchInstanceRequestSchema,
    updateInstanceByIdRequestSchema,
} from './validator.schema';
import ProcessInstanceValidator from './validator.template';
import { updateTemplateByIdRequestSchema } from '../../templates/processes/validator.schema';

const processInstanceRouter: Router = Router();

const processInstanceRouterController = createController(ProcessInstance);
const processInstanceValidatorController = createController(ProcessInstanceValidator, true);

processInstanceRouter.get('/:id', ValidateRequest(getInstanceByIdRequestSchema), processInstanceRouterController.getProcessById);
processInstanceRouter.post(
    '/',
    ValidateRequest(createInstanceRequestSchema),
    processInstanceValidatorController.validateCreateProcessInstance,
    processInstanceRouterController.createProcess,
);
processInstanceRouter.post('/search', ValidateRequest(searchInstanceRequestSchema), processInstanceRouterController.searchProcesses);
processInstanceRouter.delete('/:id', ValidateRequest(deleteInstanceByIdRequestSchema), processInstanceRouterController.deleteProcess);
processInstanceRouter.put('/template/:id', ValidateRequest(updateTemplateByIdRequestSchema), processInstanceRouterController.updateTemplate);
processInstanceRouter.put(
    '/:id',
    ValidateRequest(updateInstanceByIdRequestSchema),
    processInstanceValidatorController.validateUpdateProcessInstance,
    processInstanceRouterController.updateProcess,
);

processInstanceRouter.patch('/archive/:id', ValidateRequest(archivedProcessRequestSchema), processInstanceRouterController.archiveProcess);

export default processInstanceRouter;
