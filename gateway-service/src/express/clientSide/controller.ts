import { Request, Response } from 'express';
import DefaultController from '../../utils/express/controller';
import ClientSideManager from './manager';

class ClientSideController extends DefaultController<ClientSideManager> {
    constructor(workspaceId: string) {
        super(new ClientSideManager(workspaceId));
    }

    async getAllClientSideTemplates(req: Request, res: Response) {
        res.json(await this.manager.getAllClientSideTemplates(req.body.usersInfoChildTemplateId));
    }

    async getInstancesByTemplateId(req: Request, res: Response) {
        res.json(await this.manager.getInstancesByTemplateId(req.params.templateId as string, req.body.kartoffelId));
    }

    async countEntitiesOfTemplatesByUserEntityId(req: Request, res: Response) {
        res.json(await this.manager.countEntitiesOfTemplatesByUserEntityId(req.body.templateIds, req.body.userEntityId));
    }

    async searchEntitiesOfTemplate(req: Request, res: Response) {
        res.json(await this.manager.searchEntitiesOfTemplate(req.params.templateId as string, req.body));
    }

    async getExpandedEntityById(req: Request, res: Response) {
        res.json(
            await this.manager.getExpandedEntityById(req.params.entityId as string, req.body.expandedParams, req.body.options, req.user!.kartoffelId),
        );
    }

    async createEntity(req: Request, res: Response) {
        const { ignoredRules, ...entityData } = req.body;
        res.json(await this.manager.createEntity(entityData, req.files || (req.file ? [req.file] : []), ignoredRules, req.user!));
    }

    async getMyNotifications(req: Request, res: Response) {
        res.json(await this.manager.getMyNotifications(req.user!, req.query));
    }

    async getMyNotificationGroupCount(req: Request, res: Response) {
        res.json(await this.manager.getMyNotificationGroupCount(req.user!, req.body));
    }

    async manyNotificationSeen(req: Request, res: Response) {
        res.json(await this.manager.manyNotificationSeen(req.user!, req.body));
    }
}

export default ClientSideController;
