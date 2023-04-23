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
} from './validator.schema';

import { validateProcessInstance } from './validator.template';

const processInstanceRouter: Router = Router();

processInstanceRouter.get('/:id', ValidateRequest(getInstanceByIdRequestSchema), wrapController(ProcessInstance.getProcessById));
processInstanceRouter.post(
    '/',
    ValidateRequest(createInstanceRequestSchema),
    wrapMiddleware(validateProcessInstance),
    wrapController(ProcessInstance.createProcess),
);
processInstanceRouter.post('/search', ValidateRequest(searchInstanceRequestSchema), wrapController(ProcessInstance.searchProcesses));
processInstanceRouter.delete('/:id', ValidateRequest(deleteInstanceByIdRequestSchema), wrapController(ProcessInstance.deleteProcess));
processInstanceRouter.put(
    '/:id',
    ValidateRequest(updateInstanceByIdRequestSchema),
    wrapMiddleware(validateProcessInstance),
    wrapController(ProcessInstance.updateProcess),
);

export default processInstanceRouter;
