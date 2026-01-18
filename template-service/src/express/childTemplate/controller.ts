import { IMongoChildTemplate } from '@packages/child-template';
import { DefaultController, fetchPropertyFromRequest } from '@packages/utils';
import { Request, Response } from 'express';
import ChildTemplateManager from './manager';

class ChildTemplateController extends DefaultController<IMongoChildTemplate, ChildTemplateManager> {
    constructor(workspaceId: string) {
        super(new ChildTemplateManager(workspaceId));
    }

    async searchChildTemplates(req: Request, res: Response) {
        res.json(await this.manager.searchChildTemplates(req.body));
    }

    async createChildTemplate(req: Request, res: Response) {
        res.json(await this.manager.createChildTemplate(req.body));
    }

    async getAllChildTemplates(_req: Request, res: Response) {
        res.json(await this.manager.getAllChildTemplates());
    }

    async getChildTemplateById(req: Request, res: Response) {
        res.json(await this.manager.getChildTemplateById(req.params.id as string));
    }

    async updateChildTemplate(req: Request, res: Response) {
        res.json(await this.manager.updateChildTemplate(req.params.id as string, req.body));
    }

    async deleteChildTemplate(req: Request, res: Response) {
        res.json(await this.manager.deleteChildTemplate(req.params.id as string));
    }

    async updateEntityTemplateAction(req: Request, res: Response) {
        const { templateId: id } = req.params;
        const actionToUpsert = fetchPropertyFromRequest<string>(req, 'actions');

        res.json(await this.manager.updateEntityTemplateAction(id as string, actionToUpsert));
    }

    async updateChildTemplateStatus(req: Request, res: Response) {
        const { templateId: id } = req.params;
        res.json(await this.manager.updateChildTemplateStatus(id as string, req.body.disabled));
    }

    async multiUpdateChildTemplateStatusByParentId(req: Request, res: Response) {
        const { parentId } = req.params;
        res.json(await this.manager.multiUpdateChildTemplateStatusByParentId(parentId as string, req.body.disabled));
    }
}

export default ChildTemplateController;
