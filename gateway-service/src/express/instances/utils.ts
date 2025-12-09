import { getDefaultFilterFromChildTemplate, IEntity, ISearchFilter, NotFoundError, ValidationError } from '@microservices/shared';
import { unflattenUnitHierarchy } from 'gateway-service/src/utils/units';
import InstancesService from '../../externalServices/instanceService';
import Kartoffel from '../../externalServices/kartoffel';
import EntityTemplateService from '../../externalServices/templates/entityTemplateService';
import UserService from '../../externalServices/userService';
import DefaultController from '../../utils/express/controller';
import WorkspaceService from '../workspaces/service';

class InstancesUtils extends DefaultController {
    private workspaceId: string;

    private entityTemplateService: EntityTemplateService;

    private instancesService: InstancesService;

    constructor(workspaceId: string) {
        super(null);
        this.workspaceId = workspaceId;
        this.entityTemplateService = new EntityTemplateService(workspaceId);
        this.instancesService = new InstancesService(workspaceId);
    }

    async validateEntityProperties(properties: IEntity['properties'], templateId: string, userId: string, childTemplateId?: string) {
        const template = childTemplateId
            ? await this.entityTemplateService.getChildTemplateById(childTemplateId)
            : await this.entityTemplateService.getEntityTemplateById(templateId);

        const userUnits = (await unflattenUnitHierarchy(this.workspaceId, userId)).map((unit) => unit._id);

        await Promise.all(
            Object.entries(properties).map(async ([key, value]) => {
                if (!value) return;
                const prop = template.properties.properties[key];

                switch (prop?.format) {
                    case 'unitField': {
                        const unit = await UserService.getUnitById(value).catch(() => undefined);
                        const noUnitPermission = childTemplateId && unit && userUnits && !userUnits?.includes(unit._id);

                        // We need both logical operators because if there is no unit, noUnitPermission is false
                        // but we still need to throw an error
                        if (!unit || noUnitPermission) {
                            throw new ValidationError('must be unit', {
                                message: 'must be unit',
                                path: key,
                                schemaPath: `#/properties/${key}/type`,
                                params: {
                                    type: prop.type,
                                },
                            });
                        }

                        break;
                    }

                    case 'user': {
                        try {
                            const userId: string = JSON.parse(value)._id;
                            await Kartoffel.getUserById(userId);
                        } catch {
                            throw new ValidationError('must be user', {
                                message: 'must be user',
                                path: key,
                                schemaPath: `#/properties/${key}/type`,
                                params: {
                                    type: prop.type,
                                },
                            });
                        }
                        break;
                    }

                    case 'relationshipReference': {
                        const { relatedTemplateId } = prop.relationshipReference!;
                        try {
                            const entity = await this.instancesService.getEntityInstanceById(value);
                            if (entity.templateId !== relatedTemplateId) throw new Error('Wrong template');
                        } catch (error) {
                            if (error instanceof NotFoundError)
                                throw new ValidationError('must be relationshipReference', {
                                    message: 'must be relationshipReference',
                                    path: key,
                                    schemaPath: `#/properties/${key}/type`,
                                    params: {
                                        type: prop.type,
                                    },
                                });
                        }

                        break;
                    }
                }

                if (prop?.items?.format === 'user') {
                    const userIds: string[] = value.map((userString) => JSON.parse(userString)._id);
                    const users = await Kartoffel.getUsersByIds(userIds);
                    if (userIds.length !== users.length) {
                        throw new ValidationError('must be users', {
                            message: 'must be users',
                            path: key,
                            schemaPath: `#/properties/${key}/type`,
                            params: {
                                type: prop.items.type,
                            },
                        });
                    }
                }
            }),
        );
    }

    async getChildFilters(childTemplateId: string, userId: string): Promise<ISearchFilter | undefined> {
        const [currentUser, workspaceHierarchyIds, childTemplate] = await Promise.all([
            UserService.getUserById(userId),
            WorkspaceService.getWorkspaceHierarchyIds(this.workspaceId),
            this.entityTemplateService.getChildTemplateById(childTemplateId),
        ]);

        return getDefaultFilterFromChildTemplate(childTemplate, currentUser, { id: this.workspaceId, hierarchyIds: workspaceHierarchyIds });
    }
}

export default InstancesUtils;
