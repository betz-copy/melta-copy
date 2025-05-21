import { Request, Response } from 'express';
import { IMongoBaseConfig, DefaultController } from '@microservices/shared';
import ConfigManager from './manager';

class ConfigController extends DefaultController<IMongoBaseConfig, ConfigManager> {
    constructor(workspaceId: string) {
        super(new ConfigManager(workspaceId));
    }

    async getConfigs(_req: Request, res: Response) {
        res.json(await this.manager.getConfigs());
    }

    async getOrderConfigByName(req: Request, res: Response) {
        res.json(await this.manager.getOrderConfigByName(req.params.configName));
    }

    async updateOrder(req: Request, res: Response) {
        const { newIndex, item }: { newIndex: number; item: string } = req.body;
        res.json(await this.manager.updateOrder(req.params.configId, newIndex, item));
    }

    async createOrder(req: Request, res: Response) {
        res.json(await this.manager.createOrder(req.body));
    }
}

export default ConfigController;
