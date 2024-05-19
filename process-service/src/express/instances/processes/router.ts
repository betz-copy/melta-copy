import { Router } from 'express';
import ProcessInstance from './controller';
import { wrapController, wrapMiddleware } from '../../../utils/express';
import ValidateRequest from '../../../utils/joi';
import {
    getInstanceByIdRequestSchema,
    updateInstanceByIdRequestSchema,
    deleteInstanceByIdRequestSchema,
    createInstanceRequestSchema,
    searchInstanceRequestSchema,
    archivedProcessRequestSchema,
} from './validator.schema';

import { validateCreateProcessInstance, validateUpdateProcessInstance } from './validator.template';

const processInstanceRouter: Router = Router();

processInstanceRouter.get('/:id', ValidateRequest(getInstanceByIdRequestSchema), wrapController(ProcessInstance.getProcessById));
processInstanceRouter.post(
    '/',
    ValidateRequest(createInstanceRequestSchema),
    wrapMiddleware(validateCreateProcessInstance),
    wrapController(ProcessInstance.createProcess),
);
processInstanceRouter.post('/search', ValidateRequest(searchInstanceRequestSchema), wrapController(ProcessInstance.searchProcesses));
processInstanceRouter.delete('/:id', ValidateRequest(deleteInstanceByIdRequestSchema), wrapController(ProcessInstance.deleteProcess));
processInstanceRouter.put(
    '/:id',
    ValidateRequest(updateInstanceByIdRequestSchema),
    wrapMiddleware(validateUpdateProcessInstance),
    wrapController(ProcessInstance.updateProcess),
);

processInstanceRouter.patch('/archive/:id', ValidateRequest(archivedProcessRequestSchema), wrapController(ProcessInstance.archiveProcess));

export default processInstanceRouter;
