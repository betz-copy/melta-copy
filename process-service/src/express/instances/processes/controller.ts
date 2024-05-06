import { Request, Response } from 'express';
import ProcessInstanceManager from './manager';

class ProcessInstanceController {
    static async getProcessById(req: Request, res: Response) {
        res.json(await ProcessInstanceManager.getProcessById(req.params.id));
    }

    static async getAllProcesses(_req: Request, res: Response) {
        res.json(await ProcessInstanceManager.getAllProcesses());
    }

    static async createProcess(req: Request, res: Response) {
        res.json(await ProcessInstanceManager.createProcess(req.body));
    }

    static async deleteProcess(req: Request, res: Response) {
        res.json(await ProcessInstanceManager.deleteProcess(req.params.id));
    }

    static async updateProcess(req: Request, res: Response) {
        res.json(await ProcessInstanceManager.updateProcess(req.params.id, req.body));
    }

    static async archiveProcess(req: Request, res: Response) {
        res.json(await ProcessInstanceManager.archiveProcess(req.params.id, req.body));
    }

    static async searchProcesses(req: Request, res: Response) {
        res.json(await ProcessInstanceManager.searchProcesses(req.body));
    }
}

export default ProcessInstanceController;
