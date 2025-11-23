import { DefaultController, IProcessInstance } from '@microservices/shared';
import { Request, Response } from 'express';
import ProcessInstanceManager from './manager';

export default class ProcessInstanceController extends DefaultController<IProcessInstance, ProcessInstanceManager> {
    constructor(workspaceId: string) {
        super(new ProcessInstanceManager(workspaceId));
    }

    async getProcessById(req: Request, res: Response) {
        res.json(await this.manager.getProcessById(req.params.id));
    }

    async createProcess(req: Request, res: Response) {
        const { userId, ...createdFields } = req.body;

        res.json(await this.manager.createProcess(createdFields, userId));
    }

    async deleteProcess(req: Request, res: Response) {
        res.json(await this.manager.deleteProcess(req.params.id));
    }

    async updateTemplate(req: Request, res: Response) {
        res.json(await this.manager.updateTemplate(req.params.id, req.body));
    }

    async updateProcess(req: Request, res: Response) {
        const { userId, ...updatedFields } = req.body;

        res.json(await this.manager.updateProcess(req.params.id, updatedFields, userId));
    }

    async archiveProcess(req: Request, res: Response) {
        res.json(await this.manager.archiveProcess(req.params.id, req.body));
    }

    async searchProcesses(req: Request, res: Response) {
        res.json(await this.manager.searchProcesses(req.body));
    }
}
