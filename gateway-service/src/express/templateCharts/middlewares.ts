import { ForbiddenError, IChartPermission, IChildTemplatePopulated, IMongoChart, IMongoEntityTemplatePopulated } from '@microservices/shared';
import { Request } from 'express';
import EntityTemplateService from '../../externalServices/templates/entityTemplateService';
import { Authorizer, RequestWithPermissionsOfUserId } from '../../utils/authorizer';
import DefaultController from '../../utils/express/controller';
import ChartManager from './manager';

class ChartsValidator extends DefaultController {
    private chartManager: ChartManager;

    private authorizer: Authorizer;

    private entityTemplateService: EntityTemplateService;

    constructor(workspaceId: string) {
        super(null);
        this.chartManager = new ChartManager(workspaceId);
        this.authorizer = new Authorizer(workspaceId);
        this.entityTemplateService = new EntityTemplateService(workspaceId);
    }

    private async getCategoryIdFromTemplateId(
        templateId: string,
        isChildTemplate?: boolean,
    ): Promise<{
        categoryId: string;
        template: IChildTemplatePopulated | IMongoEntityTemplatePopulated;
    }> {
        console.log({ templateId });

        const template = isChildTemplate
            ? await this.entityTemplateService.getChildTemplateById(templateId)
            : await this.entityTemplateService.getEntityTemplateById(templateId);

        const categoryId = template.category._id;
        return { categoryId, template };
    }

    private async validateUserIsCreatorOfChart(req: Request, chart: IMongoChart) {
        const { permission, createdBy, _id } = chart;

        if (permission === IChartPermission.Private && req.user?.id !== createdBy)
            /// until now only the creator can update if its private but if protected evey user canupdate
            throw new ForbiddenError('user not authorized', { metadata: `user does not have write permission on chart ${_id}` });
    }

    private async validateUserHasPermissionToTemplate(req: Request, templateId: string, isChildTemplate?: boolean) {
        const [{ categoryId, template }, userPermissions] = await Promise.all([
            this.getCategoryIdFromTemplateId(templateId, isChildTemplate),
            this.authorizer.getWorkspacePermissions(req.user!.id),
        ]);

        const categoryPermissions = userPermissions.instances?.categories?.[categoryId];
        // SHIREL
        if (
            !userPermissions.admin?.scope &&
            !categoryPermissions?.scope &&
            (isChildTemplate
                ? !categoryPermissions?.entityTemplates?.[(template as IChildTemplatePopulated).parentTemplate._id]?.scope &&
                  !categoryPermissions?.entityTemplates?.[(template as IChildTemplatePopulated)._id]?.scope
                : !categoryPermissions?.entityTemplates?.[templateId]?.scope)
        ) {
            throw new ForbiddenError('user not authorized', { metadata: `user does not have write permission on category ${categoryId}` });
        }
    }

    private async validateUserHasPermissionToChart(req: Request, newChart: boolean = false) {
        const { templateId } = req.body;

        this.validateUserHasPermissionToTemplate(req, templateId);

        if (!newChart) {
            const { chartId } = req.params;

            const chart = await this.chartManager.getChartById(chartId);

            await this.validateUserIsCreatorOfChart(req, chart);
        }
    }

    async validateUserCanGetChartsByTemplate(req: Request) {
        const { templateId } = req.params;
        const { isChildTemplate } = req.body;

        return this.validateUserHasPermissionToTemplate(req, templateId, isChildTemplate);
    }

    async validateUserCanGetChartById(req: Request) {
        const { chartId } = req.params;
        const chart = await this.chartManager.getChartById(chartId);

        await this.validateUserHasPermissionToTemplate(req, chart.templateId);
        await this.validateUserIsCreatorOfChart(req, chart);
    }

    async validateUserCanDeleteRerencedDahboardItem(req: Request) {
        const { deleteReferenceDashboardItems } = req.query as { deleteReferenceDashboardItems?: boolean };
        const userPermissions = await this.authorizer.getWorkspacePermissions(req.user!.id);

        if (deleteReferenceDashboardItems && !userPermissions.admin?.scope)
            throw new ForbiddenError('user not authorized', { metadata: `user does not have write permission on dashboard` });
    }

    async validateUserCanCreateChart(req: Request) {
        const { toDashboard } = req.query as { toDashboard?: boolean };
        const userPermissions = await this.authorizer.getWorkspacePermissions(req.user!.id);

        if (toDashboard && !userPermissions.admin?.scope)
            throw new ForbiddenError('user not authorized', { metadata: `user does not have write permission on dashboard` });

        return this.validateUserHasPermissionToChart(req, true);
    }

    async validateUserCanUpdateChart(req: Request) {
        await this.validateUserCanDeleteRerencedDahboardItem(req);
        return this.validateUserHasPermissionToChart(req);
    }

    async validateUserCanDeleteChart(req: Request) {
        const { chartId } = req.params;

        await this.validateUserCanDeleteRerencedDahboardItem(req);

        const chart = await this.chartManager.getChartById(chartId);

        await this.validateUserHasPermissionToTemplate(req, chart.templateId);
        await this.validateUserIsCreatorOfChart(req, chart);
    }

    async validateUserCanCreateChartWithRelatedTemplate(req: Request) {
        const { body, permissionsOfUserId, user } = req as RequestWithPermissionsOfUserId;

        const hasPermissionToRelatedTemplate = await this.chartManager.validateAllowedRelatedTemplate(user!.id, permissionsOfUserId, body);
        if (!hasPermissionToRelatedTemplate) throw new ForbiddenError(`doesn't have permission to related Template`);
    }

    async validateUserCanUpdateChartWithRelatedTemplate(req: Request) {
        const { body, permissionsOfUserId, user } = req as RequestWithPermissionsOfUserId;

        if (user?.id && permissionsOfUserId) {
            const hasPermissionToRelatedTemplate = await this.chartManager.validateAllowedRelatedTemplate(user!.id, permissionsOfUserId, body);
            if (!hasPermissionToRelatedTemplate) throw new ForbiddenError(`doesn't have permission to related Template`);
        }
    }
}

export default ChartsValidator;
