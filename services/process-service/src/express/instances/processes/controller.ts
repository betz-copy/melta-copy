import { Request, Response } from 'express';
import DefaultController from '../../../utils/express/controller';
import { IProcessInstance } from './interface';
import ProcessInstanceManager from './manager';

export default class ProcessInstanceController extends DefaultController<IProcessInstance, ProcessInstanceManager> {
    constructor(workspaceId: string) {
        super(new ProcessInstanceManager(workspaceId));
    }

    async getProcessById(req: Request, res: Response) {
        res.json(await this.manager.getProcessById(req.params.id));
    }

    async createProcess(req: Request, res: Response) {
        res.json(await this.manager.createProcess(req.body));
    }

    async deleteProcess(req: Request, res: Response) {
        res.json(await this.manager.deleteProcess(req.params.id));
    }

    async updateProcess(req: Request, res: Response) {
        res.json(await this.manager.updateProcess(req.params.id, req.body));
    }

    async archiveProcess(req: Request, res: Response) {
        res.json(await this.manager.archiveProcess(req.params.id, req.body));
    }

    async searchProcesses(req: Request, res: Response) {
        res.json(await this.manager.searchProcesses(req.body));
    }
}
