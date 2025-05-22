import { Request } from 'express';
import DefaultController from '../../utils/express/controller';
import { Authorizer, RequestWithPermissionsOfUserId } from '../../utils/authorizer';
import { EntityTemplateService } from '../../externalServices/templates/entityTemplateService';
import { ForbiddenError } from '../error';
import { ChartManager } from './manager';
import { IMongoChart, IPermission } from '../../externalServices/dashboardService/chartService';

export class ChartsValidator extends DefaultController {
    private chartManager: ChartManager;

    private authorizer: Authorizer;

    private entityTemplateService: EntityTemplateService;

    constructor(workspaceId: string) {
        super(null);
        this.chartManager = new ChartManager(workspaceId);
        this.authorizer = new Authorizer(workspaceId);
        this.entityTemplateService = new EntityTemplateService(workspaceId);
    }

    private async getCategoryIdFromTemplateId(templateId: string) {
        const { category } = await this.entityTemplateService.getEntityTemplateById(templateId);
        return category._id;
    }

    private async validateUserIsCreatorOfChart(req: Request, chart: IMongoChart) {
        const { permission, createdBy, _id } = chart;

        if (permission === IPermission.Private && req.user?.id !== createdBy)
            throw new ForbiddenError('user not authorized', { metadata: `user does not have write permission on chart ${_id}` });
    }

    private async validateUserHasPermissionToTemplate(req: Request, templateId: string) {
        const [categoryId, userPermissions] = await Promise.all([
            this.getCategoryIdFromTemplateId(templateId),
            this.authorizer.getWorkspacePermissions(req.user!.id),
        ]);

        const categoryPermissions = userPermissions.instances?.categories?.[categoryId];

        if (!userPermissions.admin?.scope && !categoryPermissions?.scope && !categoryPermissions?.entityTemplates?.[templateId]?.scope)
            throw new ForbiddenError('user not authorized', { metadata: `user does not have write permission on category ${categoryId}` });
    }

    private async validateUserHasPermissionToChart(req: Request, templateId: string, newChart: boolean = false) {
        this.validateUserHasPermissionToTemplate(req, templateId);

        if (!newChart) {
            const { chartId } = req.params;

            const chart = await this.chartManager.getChartById(chartId);

            await this.validateUserIsCreatorOfChart(req, chart);
        }
    }

    async validateUserCanGetChartsByTemplate(req: Request) {
        const { templateId } = req.params;

        return this.validateUserHasPermissionToTemplate(req, templateId);
    }

    async validateUserCanGetChartById(req: Request) {
        const { chartId } = req.params;
        const chart = await this.chartManager.getChartById(chartId);

        await this.validateUserHasPermissionToTemplate(req, chart.templateId);
        await this.validateUserIsCreatorOfChart(req, chart);
    }

    async validateUserCanCreateChart(req: Request) {
        return this.validateUserHasPermissionToChart(req, req.body.chart.templateId, true);
    }

    async validateUserCanUpdateChart(req: Request) {
        return this.validateUserHasPermissionToChart(req, req.body.templateId);
    }

    async validateUserCanDeleteChart(req: Request) {
        const { chartId } = req.params;
        const chart = await this.chartManager.getChartById(chartId);

        await this.validateUserHasPermissionToTemplate(req, chart.templateId);
        await this.validateUserIsCreatorOfChart(req, chart);
    }

    async validateUserCanCreateChartWithRelatedTemplate(req: Request) {
        const {
            body: { chart },
            permissionsOfUserId,
            user,
        } = req as RequestWithPermissionsOfUserId;

        const hasPermissionToRelatedTemplate = await this.chartManager.validateAllowedRelatedTemplate(user?.id!, permissionsOfUserId, chart);
        if (!hasPermissionToRelatedTemplate) throw new ForbiddenError(`doesn't have permission to related Template`);
    }

    async validateUserCanUpdateChartWithRelatedTemplate(req: Request) {
        const { body, permissionsOfUserId, user } = req as RequestWithPermissionsOfUserId;

        if (user?.id && permissionsOfUserId) {
            const hasPermissionToRelatedTemplate = await this.chartManager.validateAllowedRelatedTemplate(user?.id!, permissionsOfUserId, body);
            if (!hasPermissionToRelatedTemplate) throw new ForbiddenError(`doesn't have permission to related Template`);
        }
    }
}
