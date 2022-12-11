import { Request, Response } from 'express';
import ProcessInstanceManager from './manager';

class ProcessInstanceController {
    static async getProcessById(req: Request, res: Response) {
        const { processId: id } = req.params;
        res.json(await ProcessInstanceManager.getProcessById(id));
    }

    static async createProcess(req: Request, res: Response) {
        res.json(await ProcessInstanceManager.createProcess(req.body));
    }

    static async deleteProcess(req: Request, res: Response) {
        const { processId: id } = req.params;
        res.json(await ProcessInstanceManager.deleteProcess(id));
    }

    static async updateProcess(req: Request, res: Response) {
        const { processId: id } = req.params;
        res.json(await ProcessInstanceManager.updateProcess(id, req.body));
    }

    static async searchProcesses(req: Request, res: Response) {
        res.json(await ProcessInstanceManager.searchProcesses(req.body));
    }
}

export default ProcessInstanceController;
