import i18next from 'i18next';
import { IEntityWithDirectConnections, ISearchBatchBody } from '../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IGanttItem } from '../interfaces/gantts';
import { IMongoRelationshipTemplate, IRelationshipTemplateMap } from '../interfaces/relationshipTemplates';
import { IScheduleComponentData, IScheduleComponentResourceData } from '../interfaces/syncfusion';
import { getEntityTemplateColor } from './colors';
import { getDayEnd, getDayStart } from './date';
import { filteredMap } from './filteredMap';
import * as Yup from 'yup';

const getFormattedDateAccordingToField = (date: Date, dateField: string, entityTemplate: IMongoEntityTemplatePopulated) => {
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
): ISearchBatchBody => {
    const paddedStartDate = getDayStart(startDate);
    const paddedEndDate = getDayEnd(endDate);

    const templates = ganttItems.reduce<ISearchBatchBody['templates']>((currTemplates, item) => {
        const entityTemplate = entityTemplatesMap.get(item.entityTemplate.id);
        if (!entityTemplate) throw new Error(`Entity template ${item.entityTemplate.id} not found`);

        currTemplates[item.entityTemplate.id] = {
            filter: {
                $and: {
                    [item.entityTemplate.startDateField]: {
                        $lte: getFormattedDateAccordingToField(paddedEndDate, item.entityTemplate.startDateField, entityTemplate),
                    },
                    [item.entityTemplate.endDateField]: {
                        $gte: getFormattedDateAccordingToField(paddedStartDate, item.entityTemplate.endDateField, entityTemplate),
                    },
                },
            },
            showRelationships: item.connectedEntityTemplate && [item.connectedEntityTemplate.relationshipTemplateId],
        };

        return currTemplates;
    }, {});

    return {
        limit,
        skip,
        templates,
    };
};

const isAllDay = (entityTemplate: IMongoEntityTemplatePopulated, ganttItems: IGanttItem) => {
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
        const { entity } = entityWithConnections;

        const entityTemplate = entityTemplatesMap.get(entity.templateId);
        if (!entityTemplate) return;

        const ganttItem = ganttItems.find((item) => item.entityTemplate.id === entity.templateId);
        if (!ganttItem) return;

        return {
            include: true,
            value: {
                entityTemplateId: entity.templateId,
                Id: entity.properties._id,
                StartTime: new Date(entity.properties[ganttItem.entityTemplate.startDateField]),
                EndTime: new Date(entity.properties[ganttItem.entityTemplate.endDateField]),
                IsAllDay: isAllDay(entityTemplate, ganttItem),
                entityWithConnections,
                ganttItem,
            },
        };
    });
};

export const getScheduleComponentResourceData = (
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

export const getConnectedEntityDetails = (
    ganttItem: IGanttItem,
    entityTemplatesMap: IEntityTemplateMap,
    relationshipTemplatesMap: IRelationshipTemplateMap,
): { connectedEntityTemplate?: IMongoEntityTemplatePopulated; relationship?: IMongoRelationshipTemplate; connectedEntityTemplateColor?: string } => {
    const relationship = ganttItem.connectedEntityTemplate && relationshipTemplatesMap.get(ganttItem.connectedEntityTemplate.relationshipTemplateId);
    if (!relationship) return {};

    const connectedEntityTemplateId =
        relationship.sourceEntityId === ganttItem.entityTemplate.id ? relationship.destinationEntityId : relationship.sourceEntityId;

    const connectedEntityTemplate = entityTemplatesMap.get(connectedEntityTemplateId);
    if (!connectedEntityTemplate) return { relationship };

    return { connectedEntityTemplate, relationship, connectedEntityTemplateColor: getEntityTemplateColor(connectedEntityTemplate) };
};

export const ganttItemValidationSchema = Yup.object({
    entityTemplate: Yup.object({
        id: Yup.string().required(i18next.t('validation.required')),
        startDateField: Yup.string().required(i18next.t('validation.required')),
        endDateField: Yup.string().required(i18next.t('validation.required')),
        fieldsToShow: Yup.array(Yup.string()).min(1, i18next.t('validation.required')),
    }).required(i18next.t('validation.required')),
    connectedEntityTemplate: Yup.object({
        relationshipTemplateId: Yup.string().required(i18next.t('validation.required')),
        fieldsToShow: Yup.array(Yup.string()).min(1, i18next.t('validation.required')),
    }).default(undefined),
});
export const ganttValidationSchema = Yup.object({
    name: Yup.string().required(i18next.t('validation.required')),
    items: Yup.array(ganttItemValidationSchema).required(i18next.t('validation.required')),
});
