import { getDefaultFilterFromChildTemplate, IEntity, ISearchFilter, ValidationError } from '@microservices/shared';
import config from '../../config';
import InstancesService from '../../externalServices/instanceService';
import Kartoffel from '../../externalServices/kartoffel';
import EntityTemplateService from '../../externalServices/templates/entityTemplateService';
import UserService from '../../externalServices/userService';
import DefaultController from '../../utils/express/controller';
import WorkspaceService from '../workspaces/service';

const { searchEntitiesMaxLimit } = config.instanceService;

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

        const currentUser = await UserService.getUserById(userId);

        const units: string[] = [];
        const relationshipRefs: Record<string, string[]> = {};
        const users: Set<string> = new Set();

        Object.entries(properties).forEach(([key, value]) => {
            const prop = template.properties.properties[key];

            switch (prop?.format) {
                case 'unitField':
                    units.push(value);
                    break;
                case 'user':
                    if (value) users.add(JSON.parse(value)._id);
                    break;
                case 'relationshipReference': {
                    const { relatedTemplateId } = prop.relationshipReference!;
                    if (!relationshipRefs[relatedTemplateId]) relationshipRefs[relatedTemplateId] = [];
                    if (value) relationshipRefs[relatedTemplateId].push(value);
                    break;
                }
            }

            if (prop?.items?.format === 'user' && !!value) {
                value.map((userString) => users.add(JSON.parse(userString)._id));
            }
        });

        if (units.length) {
            const fullUnits = await UserService.getUnitsByIds(units);

            if (fullUnits.length !== units.length) throw new ValidationError('Some units do not exist');

            const userUnits = currentUser.units?.[this.workspaceId];

            if (userUnits) {
                const inaccessibleUnits = fullUnits.filter((fullUnit) => !userUnits.includes(fullUnit._id));
                if (inaccessibleUnits) throw new ValidationError('User has no permission for some units');
            }
        }

        if (Object.entries(relationshipRefs).length) {
            await Promise.all(
                Object.entries(relationshipRefs).map(async ([templateId, ids]) => {
                    const entities = await this.instancesService.searchEntitiesOfTemplateRequest(templateId, {
                        skip: 0,
                        limit: searchEntitiesMaxLimit,
                        showRelationships: false,
                        entityIdsToInclude: ids,
                        filter: { $and: [{ _id: { $in: ids } }] },
                    });

                    if (entities.count !== ids.length) throw new ValidationError('Some relationship references do not exist');
                }),
            );
        }

        if (users.size) {
            const kartoffelUsers = await Kartoffel.getUsersByIds([...users]);
            if (kartoffelUsers.length !== users.size) throw new ValidationError('Some users do not exist');
        }
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
