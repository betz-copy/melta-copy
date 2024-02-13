import { Router } from 'express';
import { createController } from '../../../utils/express';
import ValidateRequest from '../../../utils/joi';
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

const processInstanceRouter: Router = Router();

const processInstanceRouterController = createController(ProcessInstance)<ProcessInstance>;
const processInstanceValidatorController = createController(ProcessInstanceValidator)<ProcessInstanceValidator>;

processInstanceRouter.get('/:id', ValidateRequest(getInstanceByIdRequestSchema), processInstanceRouterController('getProcessById'));
processInstanceRouter.post(
    '/',
    ValidateRequest(createInstanceRequestSchema),
    processInstanceValidatorController('validateCreateProcessInstance'),
    processInstanceRouterController('createProcess'),
);
processInstanceRouter.post('/search', ValidateRequest(searchInstanceRequestSchema), processInstanceRouterController('searchProcesses'));
processInstanceRouter.delete('/:id', ValidateRequest(deleteInstanceByIdRequestSchema), processInstanceRouterController('deleteProcess'));
processInstanceRouter.put(
    '/:id',
    ValidateRequest(updateInstanceByIdRequestSchema),
    processInstanceValidatorController('validateUpdateProcessInstance'),
    processInstanceRouterController('updateProcess'),
);

processInstanceRouter.patch('/archive/:id', ValidateRequest(archivedProcessRequestSchema), processInstanceRouterController('archiveProcess'));

export default processInstanceRouter;
