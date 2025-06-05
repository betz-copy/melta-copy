import { Request, Response } from 'express';
import DefaultController from '../../utils/express/controller';
import SimbaManager from './manager';

class SimbaController extends DefaultController<SimbaManager> {
    constructor(workspaceId: string) {
        super(new SimbaManager(workspaceId));
    }

    async getAllTemplates(_req: Request, res: Response) {
        res.json(await this.manager.getAllTemplates());
    }

    async getAllSimbaTemplates(req: Request, res: Response) {
        res.json(await this.manager.getAllSimbaTemplates(req.body.usersInfoChildTemplateId));
    }

    async getAllRelationshipTemplates(req: Request, res: Response) {
        res.json(await this.manager.getAllRelationshipTemplates(req.params.templateId));
    }

    async getInstancesByTemplateId(req: Request, res: Response) {
        res.json(await this.manager.getInstancesByTemplateId(req.params.templateId, req.body.kartoffelId));
    }

    async getEntityChildTemplateById(req: Request, res: Response) {
        res.json(await this.manager.getEntityChildTemplateById(req.params.templateId));
    }

    async countEntitiesOfTemplatesByUserEntityId(req: Request, res: Response) {
        res.json(await this.manager.countEntitiesOfTemplatesByUserEntityId(req.body.templateIds, req.body.userEntityId));
    }

    async searchEntitiesOfTemplate(req: Request, res: Response) {
        res.json(await this.manager.searchEntitiesOfTemplate(req.params.templateId, req.body));
    }
}

export default SimbaController;
