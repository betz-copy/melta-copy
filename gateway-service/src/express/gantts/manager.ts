import lodashIsEqual from 'lodash.isequal';
import { EntityTemplateManagerService, IMongoEntityTemplatePopulated } from '../../externalServices/entityTemplateService';
import { IGantt, ISearchGanttsBody, GanttsService, IMongoGantt, IGanttItem } from '../../externalServices/ganttsService';
import { InstanceManagerService } from '../../externalServices/instanceService';
import { IRelationshipTemplate, RelationshipsTemplateManagerService } from '../../externalServices/relationshipsTemplateService';
import { ServiceError } from '../error';
import { getAllowedEntityTemplatesForInstances } from '../instances/middlewares';
import { IPermissionsOfUser } from '../permissions/interfaces';

export class GanttManager {
    private static filterGanttWithPermissions(gantt: IMongoGantt, allowedEntityTemplates: IMongoEntityTemplatePopulated[]): IMongoGantt | null {
        const filteredItems = gantt.items.filter(({ entityTemplate }) => {
            return allowedEntityTemplates.some(({ _id }) => _id === entityTemplate.id);
        });

        return {
            ...gantt,
            items: filteredItems,
        };
    }

    static async searchGantts(searchBody: ISearchGanttsBody, permissionsOfUserId: Omit<IPermissionsOfUser, 'user'>) {
        const allowedEntityTemplates = await getAllowedEntityTemplatesForInstances(permissionsOfUserId);

        const gantts = await GanttsService.searchGantts(searchBody);
        return gantts.map((gantt) => this.filterGanttWithPermissions(gantt, allowedEntityTemplates));
    }

    static async getGanttById(ganttId: string, permissionsOfUserId: Omit<IPermissionsOfUser, 'user'>) {
        const allowedEntityTemplates = await getAllowedEntityTemplatesForInstances(permissionsOfUserId);

        const gantt = await GanttsService.getGanttById(ganttId);

        return this.filterGanttWithPermissions(gantt, allowedEntityTemplates);
    }

    private static doesRelationshipContainsEntityTemplate(
        relationshipTemplateId: string,
        relationshipTemplatesMap: Map<string, IRelationshipTemplate>,
        entityTemplateId: string,
    ) {
        const relationshipTemplate = relationshipTemplatesMap.get(relationshipTemplateId);
        if (!relationshipTemplate) {
            throw new ServiceError(400, `gantt contains unknown relationship template id "${relationshipTemplateId}"`);
        }

        const doesEntityTemplateInRelationshipTemplate =
            relationshipTemplate.sourceEntityId === entityTemplateId || relationshipTemplate.destinationEntityId === entityTemplateId;

        if (!doesEntityTemplateInRelationshipTemplate) {
            throw new ServiceError(
                400,
                `gantt contains relationship template id "${relationshipTemplateId}" which doesnt contain entity template "${entityTemplateId}" as source/destination`,
            );
        }
    }

    private static async validateGanttGroupBy(gantt: IGantt, relationshipTemplatesMap: Map<string, IRelationshipTemplate>) {
        if (!gantt.groupBy) {
            if (gantt.items.some(({ groupByRelationshipId }) => groupByRelationshipId)) {
                throw new ServiceError(400, 'gantt contains items with "groupByRelationshipId" without having "groupBy"');
            }
            return;
        }

        const groupByEntityTemplateConstraints = await InstanceManagerService.getConstraintsOfTemplate(gantt.groupBy.entityTemplateId);
        if (
            !groupByEntityTemplateConstraints.uniqueConstraints.find((uniqueConstraint) =>
                lodashIsEqual(uniqueConstraint, [gantt.groupBy!.groupNameField]),
            )
        ) {
            throw new ServiceError(
                400,
                `gantt contains groupBy with groupNameField "${gantt.groupBy.groupNameField}" which is not unique under entity template id "${gantt.groupBy.entityTemplateId}"`,
            );
        }

        gantt.items.forEach(({ groupByRelationshipId }) => {
            if (!groupByRelationshipId) {
                throw new ServiceError(400, 'gantt contains items without "groupByRelationshipId" while having "groupBy"');
            }

            GanttManager.doesRelationshipContainsEntityTemplate(groupByRelationshipId, relationshipTemplatesMap, gantt.groupBy!.entityTemplateId);
        });
    }

    private static validateEntityTemplateOfGanttItem(ganttItem: IGanttItem, entityTemplatesMap: Map<string, IMongoEntityTemplatePopulated>) {
        const {
            entityTemplate: { id: entityTemplateId, startDateField, endDateField, fieldsToShow },
        } = ganttItem;

        const entityTemplate = entityTemplatesMap.get(entityTemplateId);
        if (!entityTemplate) {
            throw new ServiceError(400, `gantt contains unknown entity template id "${entityTemplateId}"`);
        }

        [startDateField, endDateField, ...fieldsToShow].forEach((field) => {
            if (!entityTemplate.propertiesOrder.includes(field)) {
                throw new ServiceError(
                    400,
                    `gantt contains unknown field "${field}" under gantt item with entity template id "${entityTemplate._id}"`,
                );
            }
        });
    }

    private static validateRelationshipOfGanttItem(ganttItem: IGanttItem, relationshipTemplatesMap: Map<string, IRelationshipTemplate>) {
        const {
            entityTemplate: { id: entityTemplateId },
            connectedEntityTemplates,
        } = ganttItem;

        connectedEntityTemplates.forEach(({ relationshipTemplateId }) => {
            GanttManager.doesRelationshipContainsEntityTemplate(relationshipTemplateId, relationshipTemplatesMap, entityTemplateId);
        });
    }

    private static validateConnectedEntityOfGanttItem(
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
                throw new ServiceError(400, `gantt contains unknown relationship template id "${relationshipTemplateId}"`);
            }

            const otherEntityTemplateId =
                relationshipTemplate.sourceEntityId === entityTemplateId
                    ? relationshipTemplate.destinationEntityId
                    : relationshipTemplate.sourceEntityId;
            const otherEntityTemplate = allEntityTemplates.get(otherEntityTemplateId)!;

            fieldsToShow.forEach((field) => {
                if (!otherEntityTemplate.propertiesOrder.includes(field)) {
                    throw new ServiceError(
                        400,
                        `gantt contains unknown field "${field}" under entity template id "${otherEntityTemplateId}" which is connectedEntity of gantt item of entity template id "${entityTemplateId}"`,
                    );
                }
            });
        });
    }

    private static async validateTemplatesDataOfGantt(gantt: IGantt) {
        const entityTemplateIdsOfItems = gantt.items.map(({ entityTemplate: { id } }) => id);
        if (gantt.groupBy) entityTemplateIdsOfItems.push(gantt.groupBy.entityTemplateId);

        const entityTemplateIds = [...new Set(entityTemplateIdsOfItems)];
        const entityTemplates = await EntityTemplateManagerService.searchEntityTemplates({ ids: entityTemplateIds });
        const entityTemplatesMap = new Map(entityTemplates.map((entityTemplate) => [entityTemplate._id, entityTemplate]));

        gantt.items.forEach((ganttItem) => {
            GanttManager.validateEntityTemplateOfGanttItem(ganttItem, entityTemplatesMap);
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
        const relationshipTemplates = await RelationshipsTemplateManagerService.searchRelationshipTemplates({ ids: relationshipTemplateIds });
        const relationshipTemplatesMap = new Map(
            relationshipTemplates.map((relationshipTemplate) => [relationshipTemplate._id, relationshipTemplate]),
        );

        gantt.items.forEach((ganttItem) => {
            GanttManager.validateRelationshipOfGanttItem(ganttItem, relationshipTemplatesMap);
        });
        await GanttManager.validateGanttGroupBy(gantt, relationshipTemplatesMap);

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

        const additionalEntityTemplates = await EntityTemplateManagerService.searchEntityTemplates({
            ids: additionalEntityTemplateIds,
        });
        const additionalEntityTemplatesEntries: Array<[string, IMongoEntityTemplatePopulated]> = additionalEntityTemplates.map((entityTemplate) => [
            entityTemplate._id,
            entityTemplate,
        ]);

        const allEntityTemplates = new Map([...entityTemplatesMap, ...additionalEntityTemplatesEntries]);

        gantt.items.forEach((ganttItem) => {
            GanttManager.validateConnectedEntityOfGanttItem(ganttItem, allEntityTemplates, relationshipTemplatesMap);
        });
    }

    static async createGantt(gantt: IGantt) {
        await this.validateTemplatesDataOfGantt(gantt);
        return GanttsService.createGantt(gantt);
    }

    static deleteGantt(ganttId: string) {
        return GanttsService.deleteGantt(ganttId);
    }

    static async updateGantt(ganttId: string, gantt: IGantt) {
        await this.validateTemplatesDataOfGantt(gantt);
        return GanttsService.updateGantt(ganttId, gantt);
    }
}

export default GanttManager;
