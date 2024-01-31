import { Router } from 'express';
import { createController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import EntityTemplateController from './controller';
import {
    createEntityTemplateSchema,
    deleteEntityTemplateSchema,
    getEntityTemplateByIdSchema,
    searchEntityTemplatesSchema,
    updateEntityTemplateSchema,
    updateEntityTemplateStatusSchema,
} from './validator.schema';

const entityTemplateRouter: Router = Router();

const controller = createController(EntityTemplateController)<EntityTemplateController>;

entityTemplateRouter.post('/search', ValidateRequest(searchEntityTemplatesSchema), controller('searchEntityTemplates'));

entityTemplateRouter.get('/:templateId', ValidateRequest(getEntityTemplateByIdSchema), controller('getEntityTemplateById'));

entityTemplateRouter.post('/', ValidateRequest(createEntityTemplateSchema), controller('createEntityTemplate'));

entityTemplateRouter.delete('/:templateId', ValidateRequest(deleteEntityTemplateSchema), controller('deleteEntityTemplate'));

entityTemplateRouter.put('/:templateId', ValidateRequest(updateEntityTemplateSchema), controller('updateEntityTemplate'));

entityTemplateRouter.patch('/:templateId/status', ValidateRequest(updateEntityTemplateStatusSchema), controller('updateEntityTemplateStatus'));

export default entityTemplateRouter;
