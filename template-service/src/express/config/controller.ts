import { ConfigTypes, DefaultController, IMongoBaseConfig } from '@microservices/shared';
import { Request, Response } from 'express';
import ConfigManager from './manager';

class ConfigController extends DefaultController<IMongoBaseConfig, ConfigManager> {
    constructor(workspaceId: string) {
        super(new ConfigManager(workspaceId));
    }

    async getConfigs(_req: Request, res: Response) {
        res.json(await this.manager.getConfigs());
    }

    async getConfigByType(req: Request, res: Response) {
        res.json(await this.manager.getConfigByType(req.params.type as ConfigTypes));
    }

    async updateCategoryOrder(req: Request, res: Response) {
        const { newIndex, item }: { newIndex: number; item: string } = req.body;
        res.json(await this.manager.updateCategoryOrder(req.params.configId as string, newIndex, item));
    }

    async createCategoryOrder(req: Request, res: Response) {
        res.json(await this.manager.createCategoryOrder(req.body));
    }
}

export default ConfigController;
