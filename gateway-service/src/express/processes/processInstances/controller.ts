import { Request, Response } from 'express';
import DefaultController from '../../../utils/express/controller';
import { ShragaUser } from '../../../utils/express/passport';
import InstancesManager from './manager';

class ProcessInstancesController extends DefaultController<InstancesManager> {
    constructor(workspaceId: string) {
        super(new InstancesManager(workspaceId));
    }

    async getProcessInstance(req: Request, res: Response) {
        const { id: userId } = req.user as ShragaUser;
        res.json(await this.manager.getProcessInstance(req.params.id, userId));
    }

    async createProcessInstance(req: Request, res: Response) {
        const { id: userId } = req.user as ShragaUser;
        res.json(await this.manager.createProcessInstance(req.body, req.files || (req.file ? [req.file] : []), userId));
    }

    async updateProcessInstance(req: Request, res: Response) {
        const { id: userId } = req.user as ShragaUser;
        res.json(await this.manager.updateProcessInstance(req.params.id, req.body, req.files || (req.file ? [req.file] : []), userId));
    }

    async archiveProcess(req: Request, res: Response) {
        const { id: userId } = req.user as ShragaUser;
        res.json(await this.manager.archiveProcess(req.params.id, req.body, userId));
    }

    async deleteProcessInstance(req: Request, res: Response) {
        res.json(await this.manager.deleteProcessInstance(req.params.id, req.user!.id));
    }

    async searchProcessInstances(req: Request, res: Response) {
        const { id: userId } = req.user as ShragaUser;
        res.json(await this.manager.searchProcessInstances(req.body, userId));
    }
}

export default ProcessInstancesController;
