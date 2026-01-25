import { IEntityWithDirectConnections, IFilterOfTemplate, ISearchBatchBody } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { IGantt, IGanttGroupBy, IGanttItem } from '@packages/gantt';
import { IRelationshipTemplateMap } from '@packages/relationship-template';
import i18next from 'i18next';
import { cloneDeep } from 'lodash';
import * as Yup from 'yup';
import { environment } from '../globals';
import { IConnectedEntityTemplateDetails, IGanttHeatmapBox } from '../interfaces/gantts';
import { IScheduleComponentData, IScheduleComponentResourceData } from '../interfaces/syncfusion';
import { IEntityTemplateMap } from '../interfaces/template';
import { getEntitiesWithDirectConnections } from '../services/entitiesService';
import { getEntityTemplateColor } from './colors';
import { dateBetween, getDayEnd, getDayStart } from './date';
import { filteredMap } from './filteredMap';

const { groupByEntitiesChunkSize } = environment.ganttSettings;

export const getFormattedDateAccordingToField = (date: Date, dateField: string, entityTemplate: IMongoEntityTemplateWithConstraintsPopulated) => {
    switch (entityTemplate.properties.properties[dateField].format) {
        case 'date':
            return date.toISOString().split('T')[0];

        case 'date-time':
            return date.toISOString();

        default:
            throw new Error(`Date field ${dateField} is not of type date or date-time`);
    }
};

export const getEntitiesSearchBody = (
    ganttItems: IGanttItem[],
    startDate: Date,
    endDate: Date,
    limit: number,
    skip: number,
    entityTemplatesMap: IEntityTemplateMap,
    showEntitiesWithoutEndDate?: boolean,
): ISearchBatchBody => {
    const paddedStartDate = getDayStart(startDate);
    const paddedEndDate = getDayEnd(endDate);

    const templates = ganttItems.reduce<ISearchBatchBody['templates']>((currTemplates, item) => {
        const entityTemplate = entityTemplatesMap.get(item.entityTemplate.id);
        if (!entityTemplate) throw new Error(`Entity template ${item.entityTemplate.id} not found`);

        const showRelationships = item.connectedEntityTemplates.map((connectedEntityTemplate) => connectedEntityTemplate.relationshipTemplateId);
        if (item.groupByRelationshipId) showRelationships.push(item.groupByRelationshipId);

        const basicFilter: IFilterOfTemplate = {
            [item.entityTemplate.startDateField]: {
                $lte: getFormattedDateAccordingToField(paddedEndDate, item.entityTemplate.startDateField, entityTemplate),
            },
            [item.entityTemplate.endDateField]: {
                $gte: getFormattedDateAccordingToField(paddedStartDate, item.entityTemplate.endDateField, entityTemplate),
            },
            disabled: { $eq: false },
        };

        currTemplates[item.entityTemplate.id] = {
            filter: showEntitiesWithoutEndDate
                ? {
                      $or: [
                          basicFilter,
                          {
                              ...basicFilter,
                              [item.entityTemplate.endDateField]: {
                                  $eq: null,
                              },
                          },
                      ],
                  }
                : {
                      $and: basicFilter,
                  },
            showRelationships,
        };

        return currTemplates;
    }, {});

    return {
        limit,
        skip,
        templates,
    };
};

const isAllDay = (entityTemplate: IMongoEntityTemplateWithConstraintsPopulated, ganttItems: IGanttItem) => {
    return (
        entityTemplate.properties.properties[ganttItems.entityTemplate.startDateField].format === 'date' ||
        entityTemplate.properties.properties[ganttItems.entityTemplate.endDateField].format === 'date'
    );
};

export const getScheduleComponentData = (
    entities: IEntityWithDirectConnections[],
    ganttItems: IGanttItem[],
    entityTemplatesMap: IEntityTemplateMap,
): IScheduleComponentData[] => {
    return filteredMap(entities, (entityWithConnections) => {
        const { entity, relationships } = entityWithConnections;

        const entityTemplate = entityTemplatesMap.get(entity.templateId);
        if (!entityTemplate) return;

        const ganttItem = ganttItems.find((item) => item.entityTemplate.id === entity.templateId);
        if (!ganttItem) return;

        const groupedByEntityIds =
            relationships && ganttItem.groupByRelationshipId
                ? filteredMap(relationships, ({ relationship, otherEntity }) => ({
                      include: relationship.templateId === ganttItem.groupByRelationshipId,
                      value: otherEntity.properties._id,
                  }))
                : undefined;

        const startTime = entity.properties[ganttItem.entityTemplate.startDateField];
        if (startTime === undefined) return;

        let endTime = entity.properties[ganttItem.entityTemplate.endDateField];
        if (endTime === undefined) endTime = environment.maxDateTimestamp;

        return {
            include: true,
            value: {
                entityTemplateId: entity.templateId,
                groupedByEntityIds,
                entityWithConnections,
                ganttItem,
                Id: entity.properties._id,
                StartTime: new Date(startTime),
                EndTime: new Date(endTime),
                IsAllDay: isAllDay(entityTemplate, ganttItem),
            },
        };
    });
};

export const getScheduleComponentEntityTemplateResourceData = (
    ganttItems: IGanttItem[],
    entityTemplatesMap: IEntityTemplateMap,
): IScheduleComponentResourceData[] => {
    return filteredMap(ganttItems, (item) => {
        const entityTemplate = entityTemplatesMap.get(item.entityTemplate.id);
        if (!entityTemplate) return;

        return {
            include: true,
            value: {
                Id: entityTemplate._id,
                Text: entityTemplate.displayName,
                Color: getEntityTemplateColor(entityTemplate),
            },
        };
    });
};
export const getScheduleComponentGroupByEntityResourceData = async (groupBy: IGanttGroupBy): Promise<IScheduleComponentResourceData[]> => {
    const { entities } = await getEntitiesWithDirectConnections({
        limit: groupByEntitiesChunkSize,
        skip: 0,
        templates: {
            [groupBy.entityTemplateId]: {
                filter: { $and: { disabled: { $eq: false } } },
            },
        },
    });

    return filteredMap(entities, ({ entity }) => {
        const groupName = entity.properties[groupBy.groupNameField];
        if (!groupName) return;

        return {
            include: true,
            value: {
                Id: entity.properties._id,
                Text: groupName,
            },
        };
    }).sort((a, b) => a.Text.localeCompare(b.Text));
};

export const getConnectedEntityTemplatesDetails = (
    ganttItem: IGanttItem,
    entityTemplatesMap: IEntityTemplateMap,
    relationshipTemplatesMap: IRelationshipTemplateMap,
): IConnectedEntityTemplateDetails[] => {
    return filteredMap(ganttItem.connectedEntityTemplates, (ganttItemConnectedEntityTemplate) => {
        const relationship = relationshipTemplatesMap.get(ganttItemConnectedEntityTemplate.relationshipTemplateId);
        if (!relationship) return;

        const connectedEntityTemplateId =
            relationship.sourceEntityId === ganttItem.entityTemplate.id ? relationship.destinationEntityId : relationship.sourceEntityId;

        const connectedEntityTemplate = entityTemplatesMap.get(connectedEntityTemplateId);
        if (!connectedEntityTemplate) return;

        return {
            include: true,
            value: {
                connectedEntityTemplate,
                relationship,
                fieldsToShow: ganttItemConnectedEntityTemplate.fieldsToShow,
                connectedEntityTemplateColor: getEntityTemplateColor(connectedEntityTemplate),
            },
        };
    });
};

export const getGanttItemEditDetails = (
    relationshipTemplates: IRelationshipTemplateMap,
    entityTemplate?: IMongoEntityTemplateWithConstraintsPopulated,
    groupBy?: IGanttGroupBy,
) => {
    if (!entityTemplate) return {};

    const entityTemplateDateFields = filteredMap(Object.entries(entityTemplate.properties.properties), ([property, value]) => ({
        include: (value.type === 'string' && value.format === 'date') || value.format === 'date-time',
        value: property,
    }));

    const relevantRelationshipIds: string[] = [];
    const groupByRelevantRelationshipIds: string[] = [];

    Array.from(relationshipTemplates.values()).forEach((relationshipTemplate) => {
        if (relationshipTemplate.sourceEntityId === entityTemplate._id || relationshipTemplate.destinationEntityId === entityTemplate._id) {
            relevantRelationshipIds.push(relationshipTemplate._id);
            if (
                groupBy &&
                (relationshipTemplate.sourceEntityId === groupBy.entityTemplateId ||
                    relationshipTemplate.destinationEntityId === groupBy.entityTemplateId)
            ) {
                groupByRelevantRelationshipIds.push(relationshipTemplate._id);
            }
        }
    });

    return { entityTemplateDateFields, relevantRelationshipIds, groupByRelevantRelationshipIds };
};

export const getRelationshipString = (
    relationshipId: string,
    entityTemplates: IEntityTemplateMap,
    relationshipTemplates: IRelationshipTemplateMap,
) => {
    const relationShip = relationshipTemplates.get(relationshipId);
    if (!relationShip) return '';

    const sourceEntityTemplate = entityTemplates.get(relationShip.sourceEntityId);
    if (!sourceEntityTemplate) return '';

    const destinationEntityTemplate = entityTemplates.get(relationShip.destinationEntityId);
    if (!destinationEntityTemplate) return '';

    return `${relationShip.displayName} (${sourceEntityTemplate.displayName} > ${destinationEntityTemplate.displayName})`;
};

export const formikInitialGanttData = (gantt: IGantt): IGantt => {
    const items = gantt.items.map<IGantt['items'][number]>((item) => ({ ...cloneDeep(item) }));

    return { name: gantt.name, items, groupBy: gantt.groupBy };
};

export const getGanttHeatmapData = (ganttEvents: IScheduleComponentData[], groupByEntityResources: IScheduleComponentResourceData[]) => {
    return groupByEntityResources.reduce<IGanttHeatmapBox[]>((heatmapData, { Id, Text }) => {
        heatmapData.push({
            id: Id,
            title: Text,
            ganttEvents: ganttEvents.filter(
                (ganttEvent) => ganttEvent.groupedByEntityIds?.includes(Id) && dateBetween(new Date(), ganttEvent.StartTime, ganttEvent.EndTime),
            ),
        });

        return heatmapData;
    }, []);
};

export const ganttItemValidationSchema = Yup.object({
    entityTemplate: Yup.object({
        id: Yup.string().nullable().required(i18next.t('validation.required')),
        startDateField: Yup.string().nullable().required(i18next.t('validation.required')),
        endDateField: Yup.string().nullable().required(i18next.t('validation.required')),
        fieldsToShow: Yup.array(Yup.string()).min(1, i18next.t('validation.required')),
    }).required(i18next.t('validation.required')),
    connectedEntityTemplates: Yup.array(
        Yup.object({
            relationshipTemplateId: Yup.string().nullable().required(i18next.t('validation.required')),
            fieldsToShow: Yup.array(Yup.string()).min(1, i18next.t('validation.required')),
        }),
    ),
    groupByRelationshipId: Yup.string()
        .nullable()
        // the original type of 'ctx' is missing the 'from' property
        // biome-ignore lint/suspicious/noExplicitAny: never doubt Yahalom
        .test('testGroupByRelationshipId', i18next.t('gantts.requiredGroupByRelationship'), (value, ctx: any) => {
            const root = ctx.from[ctx.from.length - 1].value;

            if (!root.groupBy) return true;
            return Boolean(value);
        }),
});
export const ganttValidationSchema = Yup.object({
    name: Yup.string().required(i18next.t('validation.required')),
    items: Yup.array(ganttItemValidationSchema).required(i18next.t('validation.required')),
    groupBy: Yup.object({
        entityTemplateId: Yup.string().nullable().required(i18next.t('validation.required')),
        groupNameField: Yup.string().nullable().required(i18next.t('validation.required')),
    }).default(undefined),
});
