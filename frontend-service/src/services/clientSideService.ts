import { IMongoCategory } from '@packages/category';
import { IMongoChildTemplateWithConstraintsPopulated, isChildTemplate } from '@packages/child-template';
import { ICountSearchResult, IEntity, IEntityExpanded, IPropertyValue, ISearchEntitiesOfTemplateBody, ISearchResult } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { INotificationCountGroups, INotificationGroupCountDetails, INotificationPopulated, NotificationType } from '@packages/notification';
import { IMongoRelationshipTemplate } from '@packages/relationship-template';
import { IRuleBreach } from '@packages/rule-breach';
import { CoordinateSystem } from '@packages/utils';
import { mapValues } from 'lodash';
import axios from '../axios';
import { EntityWizardValues } from '../common/dialogs/entity';
import { environment } from '../globals';
import { locationConverterToString } from '../utils/map/convert';
import { IGetMyNotificationsRequestQuery } from './notificationService';

const { clientSideRoutes, getAllClientSideTemplates: getAllClientSideTemplatesRoute } = environment.api;

export type GetAllClientSideTemplatesType = {
    categories: IMongoCategory[];
    entityTemplates: IMongoEntityTemplateWithConstraintsPopulated[];
    relationshipTemplates: IMongoRelationshipTemplate[];
    childTemplates: IMongoChildTemplateWithConstraintsPopulated[];
};

const getAllClientSideTemplates = async (usersInfoChildTemplateId: string) => {
    const { data } = await axios.post<GetAllClientSideTemplatesType>(getAllClientSideTemplatesRoute, {
        usersInfoChildTemplateId,
    });
    return data;
};

const getCurrentUserEntity = async (templateId: string, kartoffelId: string) => {
    const { data } = await axios.post<ISearchResult>(`${clientSideRoutes}/entities/${templateId}`, {
        kartoffelId,
    });

    if (data.entities.length === 0) {
        throw new Error('User not exists in client side users table');
    }

    return data.entities[0].entity;
};

const countEntitiesOfTemplatesByUserEntityId = async (templateIds: string[], userEntityId: string) => {
    const { data } = await axios.post<ICountSearchResult[]>(`${clientSideRoutes}/entities/count/user-entity-id`, {
        templateIds,
        userEntityId,
    });
    return data;
};

const searchEntitiesOfTemplateClientSideRequest = async (
    templateId: string,
    clientSideUserEntityId: string,
    searchBody: ISearchEntitiesOfTemplateBody,
) => {
    const { data } = await axios.post<ISearchResult>(`${clientSideRoutes}/entities/search/template/${templateId}`, {
        userEntityId: clientSideUserEntityId,
        ...searchBody,
    });
    return data;
};

const getClientSideExpandedEntityByIdRequest = async (
    entityId: string,
    expandedParams: Record<string, { minLevel?: number; maxLevel: number }>,
    options?: { templateIds: string[] },
) => {
    const { data } = await axios.post<IEntityExpanded>(`${clientSideRoutes}/entities/expanded/${entityId}`, {
        expandedParams,
        options,
    });
    return data;
};

const createEntityClientSideRequest = async (
    entity: EntityWizardValues,
    childTemplate: IMongoChildTemplateWithConstraintsPopulated,
    ignoredRules?: IRuleBreach['brokenRules'],
    clientSideUserEntity?: IEntity,
) => {
    const formData = new FormData();
    const entityTemplateProperties = childTemplate.parentTemplate.properties.properties;

    const propertiesWithDefaults = childTemplate
        ? Object.entries(entityTemplateProperties).reduce(
              (acc, [key]) => {
                  if (entity.properties[key] === undefined && childTemplate.properties[key]?.defaultValue !== undefined)
                      acc[key] = childTemplate.properties[key].defaultValue;
                  else acc[key] = entity.properties[key];

                  if (entity.properties[key] === undefined && entityTemplateProperties[key]?.format === 'relationshipReference') {
                      if (entityTemplateProperties[key]?.relationshipReference?.relatedTemplateId === clientSideUserEntity?.templateId)
                          acc[key] = clientSideUserEntity?.properties._id;
                  }
                  return acc;
              },
              {} as Record<string, IPropertyValue>,
          )
        : entity.properties;

    formData.append(
        'properties',
        JSON.stringify(
            mapValues(propertiesWithDefaults, (property, key) => {
                switch (entity.template.properties.properties[key]?.format) {
                    case 'relationshipReference':
                        return property?.properties._id;
                    case 'location': {
                        if (!property) return undefined;
                        const location = JSON.parse(property);

                        if (location.coordinateSystem === CoordinateSystem.UTM)
                            return JSON.stringify({
                                location: locationConverterToString(location.location),
                                coordinateSystem: location.coordinateSystem,
                            });
                        return JSON.stringify(location);
                    }
                    case 'signature':
                        return undefined;
                    case 'date': {
                        if (!property) return undefined;
                        return new Date(property).toISOString().split('T')[0];
                    }
                    case 'date-time': {
                        if (!property) return undefined;
                        return new Date(property).toISOString();
                    }
                    default:
                        return property;
                }
            }),
        ),
    );
    const templateId = isChildTemplate(entity.template) ? entity.template.parentTemplate._id : entity.template._id;
    formData.append('templateId', templateId);

    if (ignoredRules) {
        formData.append('ignoredRules', JSON.stringify(ignoredRules));
    }

    const { data } = await axios.post<IEntity>(`${clientSideRoutes}/entities`, formData);
    return data;
};

const getMyClientSideNotificationGroupCountRequest = async (groups: INotificationCountGroups) => {
    const { data } = await axios.post<INotificationGroupCountDetails>(`${clientSideRoutes}/notifications/my/group-count`, { groups });
    return data;
};

const manyNotificationSeenClientSideRequest = async (types: NotificationType[]) => {
    const { data } = await axios.post<INotificationPopulated[]>(`${clientSideRoutes}/notifications/seen`, { types });
    return data;
};

const getMyNotificationsClientSideRequest = async (query: IGetMyNotificationsRequestQuery) => {
    const startDate = query.startDate?.toDateString();
    const endDate = query.endDate?.toDateString();

    const { data } = await axios.get<INotificationPopulated[]>(`${clientSideRoutes}/notifications/my`, {
        params: { ...query, startDate, endDate },
    });
    return data;
};

export {
    getAllClientSideTemplates,
    getCurrentUserEntity,
    countEntitiesOfTemplatesByUserEntityId,
    searchEntitiesOfTemplateClientSideRequest,
    getClientSideExpandedEntityByIdRequest,
    createEntityClientSideRequest,
    getMyClientSideNotificationGroupCountRequest,
    manyNotificationSeenClientSideRequest,
    getMyNotificationsClientSideRequest,
};
