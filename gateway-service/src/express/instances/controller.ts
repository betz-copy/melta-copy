import { promises as fsp } from 'fs';
import { promisify } from 'util';
import { Request, Response } from 'express';
import { InstancesManager } from './manager';
import { InstanceManagerService } from '../../externalServices/instanceService';


class InstancesController {
    static async createEntityInstance(req: Request, res: Response) {
        console.log("KIASGIAJGI");
        res.json(await InstancesManager.createEntityInstance(req.body, req.files as Express.Multer.File[], req.user!));
    }

    static async exportEntities(req: Request, res: Response) {
        const filePath = await InstancesManager.exportEntities(req.body);
        try {
            await promisify(res.sendFile.bind(res))(filePath);
        } finally {
            await fsp.unlink(filePath);
        }
    }

    static async updateEntityInstance(req: Request, res: Response) {
        const { ignoredRules, ...instanceData } = req.body;

        res.json(
            await InstancesManager.updateEntityInstance(req.params.id, instanceData, req.files as Express.Multer.File[], ignoredRules, req.user!.id),
        );
    }

    static async duplicateEntityInstance(req: Request, res: Response) {
        res.json(await InstancesManager.duplicateEntityInstance(req.params.id, req.body, req.files as Express.Multer.File[], req.user!));
    }

    static async viewEntityInstance(req: Request) {
        if(req.originalUrl.indexOf("export") !== -1){
            console.log("export");
            console.log(req.body);
            console.log(req.body.templates);
            for(let i=0 ; i<Object.keys(req.body.templates).length; i++){
                let entities = await InstanceManagerService.searchEntitiesOfTemplateRequest(Object.keys(req.body.templates)[i],{
                    limit: 80,
                });
                for(let i=0 ; i<entities["entities"].length; i++){
                    console.log((entities["entities"][i]))
                }
            }
        }
        else {
            console.log("view expanded");
        }
        console.log(req.originalUrl)
        console.log(req.body);
        //console.log(req.body.templateIds);
        // console.log(Object.keys(req.body.templateIds)[0]);
        console.log(req.body.templateIds[0]);
        console.log("viewed entity");
        // let entities = await InstanceManagerService.searchEntitiesOfTemplateRequest(Object.keys(req.body.templateIds)[0],{
            // let entities = await InstanceManagerService.searchEntitiesOfTemplateRequest(req.body.templateIds[0],{
            // limit: 80,
        // });
        //console.log(entities)
        //console.log(entities["entities"])
        //console.log(entities["entities"][0]["properties"])
        //for(let i=0 ; i<80; i++){
            //console.log((entities["entities"][i]))
        //}
        //await InstancesManager.viewEntityInstance(req.params.id, req.user!.id);
    }

    static async deleteEntityInstance(req: Request, res: Response) {
        res.json(await InstancesManager.deleteEntityInstance(req.params.id));
    }

    static async createRelationshipInstance(req: Request, res: Response) {
        const { relationshipInstance, ignoredRules } = req.body;

        res.json(await InstancesManager.createRelationshipInstance(relationshipInstance, ignoredRules, req.user!.id));
    }

    static async deleteRelationshipInstance(req: Request, res: Response) {
        const { ignoredRules } = req.body;

        res.json(await InstancesManager.deleteRelationshipInstance(req.params.id, ignoredRules, req.user!.id));
    }

    static async updateEntityStatus(req: Request, res: Response) {
        const { disabled, ignoredRules } = req.body;
        res.json(await InstancesManager.updateEntityStatus(req.params.id, disabled, ignoredRules, req.user!.id));
    }
}

export default InstancesController;
