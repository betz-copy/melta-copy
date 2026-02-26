import { getDefaultFilterFromChildTemplate } from '@packages/child-template';
import { IEntity, ISearchFilter } from '@packages/entity';
import { IReqUser, IUser } from '@packages/user';
import { NotFoundError, ValidationError } from '@packages/utils';
import InstancesService from '../../externalServices/instanceService';
import Kartoffel from '../../externalServices/kartoffel';
import EntityTemplateService from '../../externalServices/templates/entityTemplateService';
import UserService from '../../externalServices/userService';
import DefaultController from '../../utils/express/controller';
import { unflattenUnitHierarchy } from '../../utils/units';
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

    async validateEntityProperties(properties: IEntity['properties'], templateId: string, user: IReqUser | IUser, childTemplateId?: string) {
        const template = childTemplateId
            ? await this.entityTemplateService.getChildTemplateById(childTemplateId)
            : await this.entityTemplateService.getEntityTemplateById(templateId);

        const userUnits = (await unflattenUnitHierarchy(this.workspaceId, user._id!)).map((unit) => unit._id);

        await Promise.all(
            Object.entries(properties).map(async ([key, value]) => {
                if (!value) return;
                const prop = template.properties.properties[key];

                switch (prop?.format) {
                    case 'unitField': {
                        if (typeof value !== 'string') {
                            throw new ValidationError('must be unit', {
                                message: 'must be unit',
                                path: key,
                                schemaPath: `#/properties/${key}/type`,
                                params: {
                                    type: prop.type,
                                },
                            });
                        }
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
                            await Kartoffel.getUserById(value);
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
                    const users = await Kartoffel.getUsersByIds(value);
                    if (value.length !== users.length) {
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

    async getChildFilters(childTemplateId: string, user: IReqUser | IUser): Promise<ISearchFilter | undefined> {
        const [workspaceHierarchyIds, childTemplate] = await Promise.all([
            WorkspaceService.getWorkspaceHierarchyIds(this.workspaceId),
            this.entityTemplateService.getChildTemplateById(childTemplateId),
        ]);
        return getDefaultFilterFromChildTemplate(childTemplate, user!, { id: this.workspaceId, hierarchyIds: workspaceHierarchyIds });
    }
}

export default InstancesUtils;
