import { Router } from 'express';
import * as multer from 'multer';
import EntityTemplateController from './controller';
import { wrapController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import {
    searchEntityTemplatesSchema,
    deleteEntityTemplateSchema,
    getEntityTemplateByIdSchema,
    createEntityTemplateSchema,
    updateEntityTemplateSchema,
} from './validator.schema';
import config from '../../config';

const { uploadsFolderPath } = config.service;

const entityTemplateRouter: Router = Router();

entityTemplateRouter.post('/search', ValidateRequest(searchEntityTemplatesSchema), wrapController(EntityTemplateController.searchEntityTemplates));

entityTemplateRouter.get(
    '/:templateId',
    ValidateRequest(getEntityTemplateByIdSchema),
    wrapController(EntityTemplateController.getEntityTemplateById),
);

entityTemplateRouter.post(
    '/',
    multer({ dest: uploadsFolderPath }).single('file'),
    ValidateRequest(createEntityTemplateSchema),
    wrapController(EntityTemplateController.createEntityTemplate),
);

entityTemplateRouter.delete(
    '/:templateId',
    ValidateRequest(deleteEntityTemplateSchema),
    wrapController(EntityTemplateController.deleteEntityTemplate),
);

entityTemplateRouter.put(
    '/:templateId',
    multer({ dest: uploadsFolderPath }).single('file'),
    ValidateRequest(updateEntityTemplateSchema),
    wrapController(EntityTemplateController.updateEntityTemplate),
);

export default entityTemplateRouter;
