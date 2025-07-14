import { Router } from 'express';
import { createController, ValidateRequest } from '@microservices/shared';
import PrintingTemplateController from './controller';
import {
    createTemplateRequestSchema,
    deleteTemplateByIdRequestSchema,
    getTemplateByIdRequestSchema,
    searchTemplatesRequestSchema,
    updateTemplateByIdRequestSchema,
} from './validator.schema';

const printingTemplateRouter = Router();

const controller = createController(PrintingTemplateController);

printingTemplateRouter.get('/', controller.getAllPrintingTemplates);
printingTemplateRouter.get('/:templateId', ValidateRequest(getTemplateByIdRequestSchema), controller.getPrintingTemplateById);
printingTemplateRouter.post('/', ValidateRequest(createTemplateRequestSchema), controller.createPrintingTemplate);
printingTemplateRouter.put('/:templateId', ValidateRequest(updateTemplateByIdRequestSchema), controller.updatePrintingTemplateById);
printingTemplateRouter.delete('/:templateId', ValidateRequest(deleteTemplateByIdRequestSchema), controller.deletePrintingTemplateById);
printingTemplateRouter.post('/search', ValidateRequest(searchTemplatesRequestSchema), controller.searchPrintingTemplates);

export default printingTemplateRouter;
