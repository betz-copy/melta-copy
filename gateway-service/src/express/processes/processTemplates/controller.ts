import { Request, Response } from 'express';
import DefaultController from '../../../utils/express/controller';
import ProcessTemplateManager from './manager';

export default class ProcessTemplatesController extends DefaultController<ProcessTemplateManager> {
    constructor(workspaceId: string) {
        super(new ProcessTemplateManager(workspaceId));
    }

    async createProcessTemplate(req: Request, res: Response) {
        res.json(await this.manager.createProcessTemplate(req.body, req.files || (req.file ? [req.file] : [])));
    }

    async getTemplateById(req: Request, res: Response) {
        res.json(await this.manager.getProcessTemplate(req.params.id, req.user!.id));
    }

    async updateProcessTemplate(req: Request, res: Response) {
        res.json(await this.manager.updateProcessTemplate(req.params.id, req.body, req.files || (req.file ? [req.file] : []), req.user!.id));
    }

    async deleteProcessTemplate(req: Request, res: Response) {
        res.json(await this.manager.deleteProcessTemplate(req.params.id));
    }

    async searchProcessTemplates(req: Request, res: Response) {
        res.json(await this.manager.searchProcessTemplates(req.body, req.user!.id));
    }
}
