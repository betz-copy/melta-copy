import { IMongoChildTemplatePopulated } from '../interfaces/childTemplates';
import axios from '../axios';
import { environment } from '../globals';
import { IMongoCategory } from '../interfaces/categories';
import { ICountSearchResult, IEntity, IEntityExpanded, ISearchEntitiesOfTemplateBody, ISearchResult } from '../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IMongoRelationshipTemplate } from '../interfaces/relationshipTemplates';
import { IRuleBreach } from '../interfaces/ruleBreaches/ruleBreach';
import { EntityWizardValues } from '../common/dialogs/entity';
import { CoordinateSystem } from '../common/inputs/JSONSchemaFormik/RjsfLocationWidget';
import { locationConverterToString } from '../utils/map/convert';
import { mapValues } from 'lodash';
import { INotificationCountGroups, INotificationGroupCountDetails, INotificationPopulated, NotificationType } from '../interfaces/notifications';
import { IGetMyNotificationsRequestQuery } from './notificationService';
import { isChildTemplate } from '../utils/templates';

const { clientSideRoutes, getAllClientSideTemplates: getAllClientSideTemplatesRoute } = environment.api;

export type GetAllClientSideTemplatesType = {
    categories: IMongoCategory[];
    entityTemplates: IMongoEntityTemplatePopulated[];
    relationshipTemplates: IMongoRelationshipTemplate[];
    childTemplates: IMongoChildTemplatePopulated[];
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
    expandedParams: { [key: string]: number },
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
    childTemplate: IMongoChildTemplatePopulated,
    ignoredRules?: IRuleBreach['brokenRules'],
    clientSideUserEntity?: IEntity,
) => {
    const formData = new FormData();
    const entityTemplateProperties = childTemplate.parentTemplate.properties.properties;

    const propertiesWithDefaults = childTemplate
        ? Object.entries(entityTemplateProperties).reduce((acc, [key]) => {
              if (entity.properties[key] === undefined && childTemplate.properties[key]?.defaultValue !== undefined) {
                  acc[key] = childTemplate.properties[key].defaultValue;
              } else {
                  acc[key] = entity.properties[key];
              }

              if (entity.properties[key] === undefined && entityTemplateProperties[key]?.format === 'relationshipReference') {
                  if (entityTemplateProperties[key]?.relationshipReference?.relatedTemplateId === clientSideUserEntity?.templateId) {
                      acc[key] = clientSideUserEntity?.properties._id;
                  }
              }
              return acc;
          }, {} as Record<string, any>)
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
    const startDate = query.startDate && query.startDate.toDateString();
    const endDate = query.endDate && query.endDate.toDateString();

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
