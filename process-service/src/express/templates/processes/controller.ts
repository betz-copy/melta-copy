import { Request, Response } from 'express';
import DefaultController from '../../../utils/express/controller';
import { IProcessTemplate } from './interface';
import ProcessTemplateManager from './manager';

export default class ProcessTemplateController extends DefaultController<IProcessTemplate, ProcessTemplateManager> {
    constructor(dbName: string) {
        super(new ProcessTemplateManager(dbName));
    }

    async getTemplateById(req: Request, res: Response) {
        res.json(await this.manager.getProcessTemplateById(req.params.id));
    }

    async createTemplate(req: Request, res: Response) {
        res.json(await this.manager.createProcessTemplate(req.body));
    }

    async deleteTemplate(req: Request, res: Response) {
        res.json(await this.manager.deleteProcessTemplate(req.params.id));
    }

    async updateTemplate(req: Request, res: Response) {
        res.json(await this.manager.updateTemplate(req.params.id, req.body));
    }

    async searchTemplates(req: Request, res: Response) {
        res.json(await this.manager.searchTemplates(req.body));
    }
}
