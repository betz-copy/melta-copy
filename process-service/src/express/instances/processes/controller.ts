import { IProcessInstance } from '@packages/process';
import { DefaultController } from '@packages/utils';
import { Request, Response } from 'express';
import ProcessInstanceManager from './manager';

export default class ProcessInstanceController extends DefaultController<IProcessInstance, ProcessInstanceManager> {
    constructor(workspaceId: string) {
        super(new ProcessInstanceManager(workspaceId));
    }

    async getProcessById(req: Request, res: Response) {
        res.json(await this.manager.getProcessById(req.params.id as string));
    }

    async createProcess(req: Request, res: Response) {
        const { userId, ...createdFields } = req.body;

        res.json(await this.manager.createProcess(createdFields, userId));
    }

    async deleteProcess(req: Request, res: Response) {
        res.json(await this.manager.deleteProcess(req.params.id as string));
    }

    async updateTemplate(req: Request, res: Response) {
        res.json(await this.manager.updateTemplate(req.params.id as string, req.body));
    }

    async updateProcess(req: Request, res: Response) {
        const { userId, ...updatedFields } = req.body;

        res.json(await this.manager.updateProcess(req.params.id as string, updatedFields, userId));
    }

    async archiveProcess(req: Request, res: Response) {
        res.json(await this.manager.archiveProcess(req.params.id as string, req.body));
    }

    async searchProcesses(req: Request, res: Response) {
        res.json(await this.manager.searchProcesses(req.body));
    }
}
