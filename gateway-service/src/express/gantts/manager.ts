import {
    BadRequestError,
    IGantt,
    IGanttItem,
    IMongoEntityTemplatePopulated,
    IMongoGantt,
    IRelationshipTemplate,
    ISearchGanttsBody,
} from '@microservices/shared';
import lodashIsEqual from 'lodash.isequal';
import GanttsService from '../../externalServices/ganttsService';
import InstancesService from '../../externalServices/instanceService';
import EntityTemplateService from '../../externalServices/templates/entityTemplateService';
import RelationshipsTemplateService from '../../externalServices/templates/relationshipsTemplateService';
import { RequestWithPermissionsOfUserId } from '../../utils/authorizer';
import DefaultManagerProxy from '../../utils/express/manager';
import InstancesValidator from '../instances/middlewares';

export class GanttManager extends DefaultManagerProxy<GanttsService> {
    private instancesService: InstancesService;

    private entityTemplateService: EntityTemplateService;

    private relationshipsTemplateService: RelationshipsTemplateService;

    private instancesValidator: InstancesValidator;

    constructor(workspaceId: string) {
        super(new GanttsService(workspaceId));
        this.instancesService = new InstancesService(workspaceId);
        this.entityTemplateService = new EntityTemplateService(workspaceId);
        this.relationshipsTemplateService = new RelationshipsTemplateService(workspaceId);
        this.instancesValidator = new InstancesValidator(workspaceId);
    }

    private filterGanttWithPermissions(gantt: IMongoGantt, allowedEntityTemplates: IMongoEntityTemplatePopulated[]): IMongoGantt | null {
        const filteredItems = gantt.items.filter(({ entityTemplate }) => {
            return allowedEntityTemplates.some(({ _id }) => _id === entityTemplate.id);
        });

        return {
            ...gantt,
            items: filteredItems,
        };
    }

    async searchGantts(searchBody: ISearchGanttsBody, permissionsOfUserId: RequestWithPermissionsOfUserId['permissionsOfUserId'], userId: string) {
        const allowedEntityTemplates = await this.instancesValidator.getAllowedEntityTemplatesForInstances(permissionsOfUserId, userId);

        const gantts = await this.service.searchGantts(searchBody);
        return gantts.map((gantt) => this.filterGanttWithPermissions(gantt, allowedEntityTemplates));
    }

    async getGanttById(ganttId: string, permissionsOfUserId: RequestWithPermissionsOfUserId['permissionsOfUserId'], userId: string) {
        const allowedEntityTemplates = await this.instancesValidator.getAllowedEntityTemplatesForInstances(permissionsOfUserId, userId);

        const gantt = await this.service.getGanttById(ganttId);

        return this.filterGanttWithPermissions(gantt, allowedEntityTemplates);
    }

    private doesRelationshipContainsEntityTemplate(
        relationshipTemplateId: string,
        relationshipTemplatesMap: Map<string, IRelationshipTemplate>,
        entityTemplateId: string,
    ) {
        const relationshipTemplate = relationshipTemplatesMap.get(relationshipTemplateId);
        if (!relationshipTemplate) {
            throw new BadRequestError(`gantt contains unknown relationship template id "${relationshipTemplateId}"`);
        }

        const doesEntityTemplateInRelationshipTemplate =
            relationshipTemplate.sourceEntityId === entityTemplateId || relationshipTemplate.destinationEntityId === entityTemplateId;

        if (!doesEntityTemplateInRelationshipTemplate) {
            throw new BadRequestError(
                `gantt contains relationship template id "${relationshipTemplateId}" which doesnt contain entity template "${entityTemplateId}" as source/destination`,
            );
        }
    }

    private async validateGanttGroupBy(gantt: IGantt, relationshipTemplatesMap: Map<string, IRelationshipTemplate>) {
        if (!gantt.groupBy) {
            if (gantt.items.some(({ groupByRelationshipId }) => groupByRelationshipId)) {
                throw new BadRequestError('gantt contains items with "groupByRelationshipId" without having "groupBy"');
            }
            return;
        }

        const groupByEntityTemplateConstraints = await this.instancesService.getConstraintsOfTemplate(gantt.groupBy.entityTemplateId);
        if (
            !groupByEntityTemplateConstraints.uniqueConstraints.find((uniqueConstraint) =>
                lodashIsEqual(uniqueConstraint.properties, [gantt.groupBy!.groupNameField]),
            )
        ) {
            throw new BadRequestError(
                `gantt contains groupBy with groupNameField "${gantt.groupBy.groupNameField}" which is not unique under entity template id "${gantt.groupBy.entityTemplateId}"`,
            );
        }

        gantt.items.forEach(({ groupByRelationshipId }) => {
            if (!groupByRelationshipId) {
                throw new BadRequestError('gantt contains items without "groupByRelationshipId" while having "groupBy"');
            }

            this.doesRelationshipContainsEntityTemplate(groupByRelationshipId, relationshipTemplatesMap, gantt.groupBy!.entityTemplateId);
        });
    }

    private validateEntityTemplateOfGanttItem(ganttItem: IGanttItem, entityTemplatesMap: Map<string, IMongoEntityTemplatePopulated>) {
        const {
            entityTemplate: { id: entityTemplateId, startDateField, endDateField, fieldsToShow },
        } = ganttItem;

        const entityTemplate = entityTemplatesMap.get(entityTemplateId);
        if (!entityTemplate) {
            throw new BadRequestError(`gantt contains unknown entity template id "${entityTemplateId}"`);
        }

        [startDateField, endDateField, ...fieldsToShow].forEach((field) => {
            if (!entityTemplate.propertiesOrder.includes(field)) {
                throw new BadRequestError(`gantt contains unknown field "${field}" under gantt item with entity template id "${entityTemplate._id}"`);
            }
        });
    }

    private validateRelationshipOfGanttItem(ganttItem: IGanttItem, relationshipTemplatesMap: Map<string, IRelationshipTemplate>) {
        const {
            entityTemplate: { id: entityTemplateId },
            connectedEntityTemplates,
        } = ganttItem;

        connectedEntityTemplates.forEach(({ relationshipTemplateId }) => {
            this.doesRelationshipContainsEntityTemplate(relationshipTemplateId, relationshipTemplatesMap, entityTemplateId);
        });
    }

    private validateConnectedEntityOfGanttItem(
        ganttItem: IGanttItem,
        allEntityTemplates: Map<string, IMongoEntityTemplatePopulated>,
        relationshipTemplatesMap: Map<string, IRelationshipTemplate>,
    ) {
        const {
            entityTemplate: { id: entityTemplateId },
            connectedEntityTemplates,
        } = ganttItem;

        connectedEntityTemplates.forEach(({ relationshipTemplateId, fieldsToShow }) => {
            const relationshipTemplate = relationshipTemplatesMap.get(relationshipTemplateId);
            if (!relationshipTemplate) {
                throw new BadRequestError(`gantt contains unknown relationship template id "${relationshipTemplateId}"`);
            }

            const otherEntityTemplateId =
                relationshipTemplate.sourceEntityId === entityTemplateId
                    ? relationshipTemplate.destinationEntityId
                    : relationshipTemplate.sourceEntityId;
            const otherEntityTemplate = allEntityTemplates.get(otherEntityTemplateId)!;

            fieldsToShow.forEach((field) => {
                if (!otherEntityTemplate.propertiesOrder.includes(field)) {
                    throw new BadRequestError(
                        `gantt contains unknown field "${field}" under entity template id "${otherEntityTemplateId}" which is connectedEntity of gantt item of entity template id "${entityTemplateId}"`,
                    );
                }
            });
        });
    }

    private async validateTemplatesDataOfGantt(gantt: IGantt, userId: string) {
        const entityTemplateIdsOfItems = gantt.items.map(({ entityTemplate: { id } }) => id);
        if (gantt.groupBy) entityTemplateIdsOfItems.push(gantt.groupBy.entityTemplateId);

        const entityTemplateIds = [...new Set(entityTemplateIdsOfItems)];
        const entityTemplates = await this.entityTemplateService.searchEntityTemplates(userId, { ids: entityTemplateIds });
        const entityTemplatesMap = new Map(entityTemplates.map((entityTemplate) => [entityTemplate._id, entityTemplate]));

        gantt.items.forEach((ganttItem) => {
            this.validateEntityTemplateOfGanttItem(ganttItem, entityTemplatesMap);
        });

        const relationshipTemplateIdsOfItems = gantt.items.reduce<string[]>(
            (relationshipIds, { connectedEntityTemplates, groupByRelationshipId }) => {
                connectedEntityTemplates.forEach(({ relationshipTemplateId }) => {
                    relationshipIds.push(relationshipTemplateId);
                });

                if (groupByRelationshipId) relationshipIds.push(groupByRelationshipId);

                return relationshipIds;
            },
            [],
        );

        const relationshipTemplateIds = [...new Set(relationshipTemplateIdsOfItems)];
        const relationshipTemplates = await this.relationshipsTemplateService.searchRelationshipTemplates({ ids: relationshipTemplateIds });
        const relationshipTemplatesMap = new Map(
            relationshipTemplates.map((relationshipTemplate) => [relationshipTemplate._id, relationshipTemplate]),
        );

        gantt.items.forEach((ganttItem) => {
            this.validateRelationshipOfGanttItem(ganttItem, relationshipTemplatesMap);
        });
        await this.validateGanttGroupBy(gantt, relationshipTemplatesMap);

        const additionalEntityTemplateIdsFromRelationshipsOfItems: string[] = [];
        gantt.items.forEach(({ entityTemplate: { id: entityTemplateId }, connectedEntityTemplates }) => {
            connectedEntityTemplates.forEach(({ relationshipTemplateId }) => {
                const relationshipTemplate = relationshipTemplatesMap.get(relationshipTemplateId)!;

                const otherEntityTemplateId =
                    relationshipTemplate.sourceEntityId === entityTemplateId
                        ? relationshipTemplate.destinationEntityId
                        : relationshipTemplate.sourceEntityId;

                // it might already exists because of another item
                if (!entityTemplatesMap.has(otherEntityTemplateId)) {
                    additionalEntityTemplateIdsFromRelationshipsOfItems.push(otherEntityTemplateId);
                }
            });
        });
        const additionalEntityTemplateIds = [...new Set(additionalEntityTemplateIdsFromRelationshipsOfItems)];

        const additionalEntityTemplates = await this.entityTemplateService.searchEntityTemplates(userId, {
            ids: additionalEntityTemplateIds,
        });
        const additionalEntityTemplatesEntries: Array<[string, IMongoEntityTemplatePopulated]> = additionalEntityTemplates.map((entityTemplate) => [
            entityTemplate._id,
            entityTemplate,
        ]);

        const allEntityTemplates = new Map([...entityTemplatesMap, ...additionalEntityTemplatesEntries]);

        gantt.items.forEach((ganttItem) => {
            this.validateConnectedEntityOfGanttItem(ganttItem, allEntityTemplates, relationshipTemplatesMap);
        });
    }

    async createGantt(gantt: IGantt, userId: string) {
        await this.validateTemplatesDataOfGantt(gantt, userId);
        return this.service.createGantt(gantt);
    }

    deleteGantt(ganttId: string) {
        return this.service.deleteGantt(ganttId);
    }

    async updateGantt(ganttId: string, gantt: IGantt, userId: string) {
        await this.validateTemplatesDataOfGantt(gantt, userId);
        return this.service.updateGantt(ganttId, gantt);
    }
}

export default GanttManager;
