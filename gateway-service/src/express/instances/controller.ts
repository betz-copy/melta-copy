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
        const { ignoredRules, ...instanceData } = req.body;
        res.json(await this.manager.createEntityInstance(instanceData, req.files || (req.file ? [req.file] : []), ignoredRules, req.user!.id));
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
        const { templateId, insertBrokenEntities, isChildTemplate } = req.body;
        res.json(
            await this.manager.loadEntities(
                templateId,
                isChildTemplate === 'true',
                req.user!.id,
                req.files || (req.file ? [req.file] : []),
                insertBrokenEntities,
            ),
        );
    }

    async getChangedEntitiesFromExcel(req: Request, res: Response) {
        const { templateId, isChildTemplate } = req.body;

        res.json(await this.manager.getChangedEntitiesFromExcel(templateId, isChildTemplate === 'true', req.files?.[0] || req.file!));
    }

    async editManyEntitiesByExcel(req: Request, res: Response) {
        const { entities, isChildTemplate } = req.body;

        res.json(await this.manager.editManyEntitiesByExcel(entities, isChildTemplate === 'true', req.user!.id));
    }

    async updateMultipleEntities(req: Request, res: Response) {
        const { ignoredRules, entitiesToUpdate, propertiesToRemove, ...instanceData } = req.body;
        res.json(
            await this.manager.updateMultipleEntities(
                instanceData,
                propertiesToRemove,
                entitiesToUpdate,
                req.files || (req.file ? [req.file] : []),
                ignoredRules,
                req.user!.id,
            ),
        );
    }

    async updateEntityInstance(req: Request, res: Response) {
        const { ignoredRules, ...instanceData } = req.body;

        res.json(
            await this.manager.updateEntityInstance(
                req.params.id,
                instanceData,
                req.files || (req.file ? [req.file] : []),
                ignoredRules,
                req.user!.id,
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
        const { ignoredRules, ...instanceData } = req.body;
        res.json(
            await this.manager.duplicateEntityInstance(
                req.params.id,
                instanceData,
                req.files || (req.file ? [req.file] : []),
                ignoredRules,
                req.user!.id,
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
