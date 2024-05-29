import { Request, Response } from 'express';
import ProcessTemplateManager from './manager';

export default class ProcessTemplatesController {
    static async createProcessTemplate(req: Request, res: Response) {
        res.json(await ProcessTemplateManager.createProcessTemplate(req.body, req.files as Express.Multer.File[]));
    }

    static async getTemplateById(req: Request, res: Response) {
        res.json(await ProcessTemplateManager.getProcessTemplate(req.params.id, req.user!.id));
    }

    static async updateProcessTemplate(req: Request, res: Response) {
        res.json(await ProcessTemplateManager.updateProcessTemplate(req.params.id, req.body, req.files as Express.Multer.File[], req.user!.id));
    }

    static async deleteProcessTemplate(req: Request, res: Response) {
        res.json(await ProcessTemplateManager.deleteProcessTemplate(req.params.id));
    }

    static async searchProcessTemplates(req: Request, res: Response) {
        res.json(await ProcessTemplateManager.searchProcessTemplates(req.body, req.user!.id));
    }
}
