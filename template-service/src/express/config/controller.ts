import { Request, Response } from 'express';
import DefaultController from '../../utils/express/controller';
import { IMongoBaseConfig } from './interface';
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
        console.log('aaaaaaaaaaa', req);
        res.json(await this.manager.updateOrder(req.params.configId, req.body));
    }

    async createOrder(req: Request, res: Response) {
        res.json(await this.manager.createOrder(req.body));
    }
}

export default ConfigController;
