import { Request, Response } from 'express';




export class ConfigsController {
    static async createConfig(req: Request, res: Response){
        const { workspaceId, name, value, type, isAlive }: IConfig = req.body;
        const newFlag = new Config({ workspaceId, name, value, type, isAlive });
        await newFlag.save();
        return res.json(newFlag);
    }

    static async getConfig(req: Request, res: Response){
        const flags = await Config.find({ workspaceId: req.params.workspaceId });
        return res.json(flags);
    }
    static async updateConfig(req: Request, res: Response){
        const updatedFlag = await Config.findByIdAndUpdate(req.params.id, req.body, { new: true });
  return res.json(updatedFlag);
    }
    static async deleteConfig(req: Request, res: Response){
        await Config.findByIdAndDelete(req.params.id);
        return res.json({ message: 'Feature flag deleted' });
    }
    
}
