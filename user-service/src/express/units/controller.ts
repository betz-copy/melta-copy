import { IUnit } from '@packages/unit';
import { Request, Response } from 'express';
import UnitsManager from './manager';

class UnitsController {
    static async getUnits(req: Request, res: Response) {
        res.json(await UnitsManager.getUnits(req.query as unknown as IUnit));
    }

    static async getUnitsByIds(req: Request, res: Response) {
        res.json(await UnitsManager.getUnitsByIds(req.body.ids));
    }

    static async createUser(req: Request, res: Response) {
        res.json(await UnitsManager.createUnit(req.body));
    }

    static async updateUnit(req: Request, res: Response) {
        const { shouldEffectChildren, ...unit } = req.body;
        res.json(await UnitsManager.updateUnit(req.params.id, unit, shouldEffectChildren));
    }

    static async getUnitHierarchy(req: Request, res: Response) {
        res.json(await UnitsManager.getUnitHierarchy(req.params.workspaceId));
    }
}

export default UnitsController;
