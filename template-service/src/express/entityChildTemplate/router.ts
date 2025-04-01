import { Router } from 'express';
import { createController } from '../../utils/express';
import ValidateRequest from '../../utils/joi';
import EntityChildTemplateController from './controller';
import { searchEntityChildTemplatesSchema, getAllChildTemplatesSchema, createEntityChildTemplateSchema } from './validator.schema';

const entityChildTemplateRouter: Router = Router();

const controller = createController(EntityChildTemplateController);

entityChildTemplateRouter.post('/', ValidateRequest(searchEntityChildTemplatesSchema), controller.searchEntityChildTemplates);

entityChildTemplateRouter.get('/', ValidateRequest(getAllChildTemplatesSchema), controller.getAllChildTemplates);

entityChildTemplateRouter.post('/', ValidateRequest(createEntityChildTemplateSchema), controller.createEntityChildTemplate);

export default entityChildTemplateRouter;
