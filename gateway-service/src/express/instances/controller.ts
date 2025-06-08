import { promises as fsp } from 'fs';
import { promisify } from 'util';
import { Request, Response } from 'express';
import { IDeleteEntityBody, ISearchEntitiesByLocationBody } from '@microservices/shared';
import InstancesManager from './manager';
import DefaultController from '../../utils/express/controller';

class InstancesController extends DefaultController<InstancesManager> {
    constructor(workspaceId: string) {
        super(new InstancesManager(workspaceId));
    }

    async createEntityInstance(req: Request, res: Response) {
        const { ignoredRules, childTemplateId, ...instanceData } = req.body;
        res.json(
            await this.manager.createEntityInstance(
                instanceData,
                req.files || (req.file ? [req.file] : []),
                ignoredRules,
                req.user!.id,
                childTemplateId,
            ),
        );
    }

    async exportEntities(req: Request, res: Response) {
        const filePath = await this.manager.exportEntities(req.body);
        try {
            await promisify(res.sendFile.bind(res))(filePath);
        } finally {
            await fsp.unlink(filePath);
        }
    }

    async loadEntities(req: Request, res: Response) {
        const { templateId, childTemplateId, insertBrokenEntities } = req.body;
        res.json(
            await this.manager.loadEntities(
                templateId,
                req.user!.id,
                childTemplateId,
                req.files || (req.file ? [req.file] : []),
                insertBrokenEntities,
            ),
        );
    }

    async getChangedEntitiesFromExcel(req: Request, res: Response) {
        res.json(await this.manager.getChangedEntitiesFromExcel(req.body.templateId, req.files?.[0] || req.file!));
    }

    async editManyEntitiesByExcel(req: Request, res: Response) {
        const { entities, childTemplateId } = req.body;
        res.json(await this.manager.editManyEntitiesByExcel(entities, req.user!.id, childTemplateId));
    }

    async updateMultipleEntities(req: Request, res: Response) {
        const { ignoredRules, entitiesToUpdate, propertiesToRemove, childTemplateId, ...instanceData } = req.body;
        res.json(
            await this.manager.updateMultipleEntities(
                instanceData,
                propertiesToRemove,
                entitiesToUpdate,
                req.files || (req.file ? [req.file] : []),
                ignoredRules,
                req.user!.id,
                childTemplateId,
            ),
        );
    }

    async updateEntityInstance(req: Request, res: Response) {
        const { ignoredRules, childTemplateId, ...instanceData } = req.body;

        res.json(
            await this.manager.updateEntityInstance(
                req.params.id,
                instanceData,
                req.files || (req.file ? [req.file] : []),
                ignoredRules,
                req.user!.id,
                childTemplateId,
            ),
        );
    }

    async searchEntitiesByLocation(req: Request, res: Response) {
        res.json(await this.manager.searchEntitiesByLocation(req.body as ISearchEntitiesByLocationBody, req.user!.id));
    }

    async searchEntitiesBatch(req: Request, res: Response) {
        const { shouldSemanticSearch, ...body } = req.body;
        res.json(await this.manager.searchEntitiesBatch(shouldSemanticSearch, body));
    }

    async searchEntitiesOfTemplate(req: Request, res: Response) {
        res.json(await this.manager.searchEntitiesOfTemplate(req.params.templateId, req.body));
    }

    async getEntitiesCountByTemplates(req: Request, res: Response) {
        const { shouldSemanticSearch, ...body } = req.body;
        res.json(await this.manager.getEntitiesCountByTemplates(shouldSemanticSearch, body));
    }

    async duplicateEntityInstance(req: Request, res: Response) {
        const { ignoredRules, childTemplateId, ...instanceData } = req.body;
        res.json(
            await this.manager.duplicateEntityInstance(
                req.params.id,
                instanceData,
                req.files || (req.file ? [req.file] : []),
                ignoredRules,
                req.user!.id,
                childTemplateId,
            ),
        );
    }

    async deleteEntityInstances(req: Request, res: Response) {
        const body = req.body as IDeleteEntityBody;

        res.json(await this.manager.deleteEntityInstances(body));
    }

    async createRelationshipInstance(req: Request, res: Response) {
        const { relationshipInstance, ignoredRules } = req.body;

        res.json(await this.manager.createRelationshipInstance(relationshipInstance, ignoredRules, req.user!.id));
    }

    async deleteRelationshipInstance(req: Request, res: Response) {
        const { ignoredRules } = req.body;

        res.json(await this.manager.deleteRelationshipInstance(req.params.id, ignoredRules, req.user!.id));
    }

    async updateEntityStatus(req: Request, res: Response) {
        const { disabled, ignoredRules } = req.body;
        res.json(await this.manager.updateEntityStatus(req.params.id, disabled, ignoredRules, req.user!.id));
    }

    async exportEntityToDocumentTemplate(req: Request, res: Response) {
        res.send(await this.manager.exportEntityToDocumentTemplate(req.body));
    }

    async exportEntityToDocumentSchemaByEntityId(req: Request, res: Response) {
        res.send(
            await this.manager.exportEntityToDocumentTemplate({
                documentTemplateId: req.query.documentTemplateId as string,
                entity: await this.manager.service.getEntityInstanceById(req.params.entityId),
            }),
        );
    }

    async runBulkOfActions(req: Request, res: Response) {
        const { actionsGroups, ignoredRules } = req.body;

        res.json(await this.manager.runBulkOfActions(actionsGroups, req.query.dryRun as unknown as boolean, req.user!.id, ignoredRules));
    }
}

export default InstancesController;
