import { Request, Response } from 'express';
import DefaultController from '../../../utils/express/controller';
import InstancesManager from './manager';

class ProcessInstancesController extends DefaultController<InstancesManager> {
    constructor(workspaceId: string) {
        super(new InstancesManager(workspaceId));
    }

    async getProcessInstance(req: Request, res: Response) {
        res.json(await this.manager.getProcessInstance(req.params.id as string, req.user!));
    }

    async createProcessInstance(req: Request, res: Response) {
        res.json(await this.manager.createProcessInstance(req.body, req.files || (req.file ? [req.file] : []), req.user!));
    }

    async updateProcessInstance(req: Request, res: Response) {
        res.json(await this.manager.updateProcessInstance(req.params.id as string, req.body, req.files || (req.file ? [req.file] : []), req.user!));
    }

    async archiveProcess(req: Request, res: Response) {
        res.json(await this.manager.archiveProcess(req.params.id as string, req.body, req.user!));
    }

    async deleteProcessInstance(req: Request, res: Response) {
        res.json(await this.manager.deleteProcessInstance(req.params.id as string, req.user!));
    }

    async searchProcessInstances(req: Request, res: Response) {
        res.json(await this.manager.searchProcessInstances(req.body, req.user!));
    }
}

export default ProcessInstancesController;
