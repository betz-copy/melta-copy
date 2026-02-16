import { IMongoPrintingTemplate } from '@packages/printing-template';
import { DefaultController } from '@packages/utils';
import { Request, Response } from 'express';
import { PrintingTemplateManager } from './manager';

class PrintingTemplateController extends DefaultController<IMongoPrintingTemplate, PrintingTemplateManager> {
    constructor(workspaceId: string) {
        super(new PrintingTemplateManager(workspaceId));
    }

    async getAllPrintingTemplates(_req: Request, res: Response) {
        res.json(await this.manager.getAllPrintingTemplates());
    }

    async getPrintingTemplateById(req: Request, res: Response) {
        res.json(await this.manager.getTemplateById(req.params.templateId as string));
    }

    async updatePrintingTemplateById(req: Request, res: Response) {
        res.json(await this.manager.updateTemplateById(req.params.templateId as string, req.body));
    }

    async deletePrintingTemplateById(req: Request, res: Response) {
        res.json(await this.manager.deleteTemplateById(req.params.templateId as string));
    }

    async createPrintingTemplate(req: Request, res: Response) {
        res.json(await this.manager.createTemplate(req.body));
    }

    async searchPrintingTemplates(req: Request, res: Response) {
        res.json(await this.manager.searchTemplates(req.body));
    }
}
export default PrintingTemplateController;
