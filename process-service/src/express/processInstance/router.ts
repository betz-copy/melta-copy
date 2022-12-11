import { Router } from 'express';
import ProcessInstance from './controller';
import { wrapController, wrapMiddleware } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import {
    getInstanceByIdRequestSchema,
    updateInstanceByIdRequestSchema,
    deleteInstanceByIdRequestSchema,
    createInstanceRequestSchema,
    searchInstanceRequestSchema,
} from './validator.schema';

import { validateProcessInstance } from './validator.template';

const processInstanceRouter: Router = Router();

processInstanceRouter.get('/:processId', ValidateRequest(getInstanceByIdRequestSchema), wrapController(ProcessInstance.getProcessById));
processInstanceRouter.post(
    '/',
    ValidateRequest(createInstanceRequestSchema),
    wrapMiddleware(validateProcessInstance),
    wrapController(ProcessInstance.createProcess),
);
processInstanceRouter.post('/search', ValidateRequest(searchInstanceRequestSchema), wrapController(ProcessInstance.searchProcesses));
export default processInstanceRouter;
processInstanceRouter.delete('/:processId', ValidateRequest(deleteInstanceByIdRequestSchema), wrapController(ProcessInstance.deleteProcess));
processInstanceRouter.put(
    '/:processId',
    ValidateRequest(updateInstanceByIdRequestSchema),
    wrapMiddleware(validateProcessInstance),
    wrapController(ProcessInstance.updateProcess),
);
