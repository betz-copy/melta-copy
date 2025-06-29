import { IMongoChildEntityTemplatePopulated } from '../interfaces/entityChildTemplates';
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

const { simbaRoutes, getAllSimbaTemplates: getAllSimbaTemplatesRoute } = environment.api;

export type GetAllSimbaTemplatesType = {
    categories: IMongoCategory[];
    entityTemplates: IMongoEntityTemplatePopulated[];
    relationshipTemplates: IMongoRelationshipTemplate[];
    childTemplates: IMongoChildEntityTemplatePopulated[];
};

const getAllSimbaTemplates = async (usersInfoChildTemplateId: string) => {
    const { data } = await axios.post<GetAllSimbaTemplatesType>(getAllSimbaTemplatesRoute, {
        usersInfoChildTemplateId,
    });
    return data;
};

const getCurrentUserEntity = async (templateId: string, kartoffelId: string) => {
    const { data } = await axios.post<ISearchResult>(`${simbaRoutes}/entities/${templateId}`, {
        kartoffelId,
    });

    if (data.entities.length === 0) {
        throw new Error('User not exists in simba');
    }

    return data.entities[0].entity;
};

const countEntitiesOfTemplatesByUserEntityId = async (templateIds: string[], userEntityId: string) => {
    const { data } = await axios.post<ICountSearchResult[]>(`${simbaRoutes}/entities/count/user-entity-id`, {
        templateIds,
        userEntityId,
    });
    return data;
};

const searchEntitiesOfTemplateSimbaRequest = async (templateId: string, simbaUserEntityId: string, searchBody: ISearchEntitiesOfTemplateBody) => {
    const { data } = await axios.post<ISearchResult>(`${simbaRoutes}/entities/search/template/${templateId}`, {
        userEntityId: simbaUserEntityId,
        ...searchBody,
    });
    return data;
};

const getSimbaExpandedEntityByIdRequest = async (
    entityId: string,
    expandedParams: { [key: string]: number },
    options?: { templateIds: string[] },
) => {
    const { data } = await axios.post<IEntityExpanded>(`${simbaRoutes}/entities/expanded/${entityId}`, {
        expandedParams,
        options,
    });
    return data;
};

const createEntitySimbaRequest = async (
    entity: EntityWizardValues,
    ignoredRules?: IRuleBreach['brokenRules'],
    childTemplate?: IMongoChildEntityTemplatePopulated,
    simbaUserEntity?: IEntity,
) => {
    const formData = new FormData();
    const entityTemplateProperties = childTemplate!.fatherTemplateId.properties.properties;

    const propertiesWithDefaults = childTemplate
        ? Object.entries(entityTemplateProperties).reduce((acc, [key]) => {
              if (entity.properties[key] === undefined && childTemplate.properties[key]?.defaultValue !== undefined) {
                  acc[key] = childTemplate.properties[key].defaultValue;
              } else {
                  acc[key] = entity.properties[key];
              }

              if (entity.properties[key] === undefined && entityTemplateProperties[key]?.format === 'relationshipReference') {
                  if (entityTemplateProperties[key]?.relationshipReference?.relatedTemplateId === simbaUserEntity?.templateId) {
                      acc[key] = simbaUserEntity?.properties._id;
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
                    default:
                        return property;
                }
            }),
        ),
    );
    formData.append('templateId', entity.template._id);

    if (ignoredRules) {
        formData.append('ignoredRules', JSON.stringify(ignoredRules));
    }

    const { data } = await axios.post<IEntity>(`${simbaRoutes}/entities`, formData);
    return data;
};

const getMySimbaNotificationGroupCountRequest = async (groups: INotificationCountGroups) => {
    const { data } = await axios.post<INotificationGroupCountDetails>(`${simbaRoutes}/notifications/my/group-count`, { groups });
    return data;
};

const manyNotificationSeenSimbaRequest = async (types: NotificationType[]) => {
    const { data } = await axios.post<INotificationPopulated[]>(`${simbaRoutes}/notifications/seen`, { types });
    return data;
};

const getMyNotificationsSimbaRequest = async (query: IGetMyNotificationsRequestQuery) => {
    const startDate = query.startDate && query.startDate.toDateString();
    const endDate = query.endDate && query.endDate.toDateString();

    const { data } = await axios.get<INotificationPopulated[]>(`${simbaRoutes}/notifications/my`, {
        params: { ...query, startDate, endDate },
    });
    return data;
};

export {
    getAllSimbaTemplates,
    getCurrentUserEntity,
    countEntitiesOfTemplatesByUserEntityId,
    searchEntitiesOfTemplateSimbaRequest,
    getSimbaExpandedEntityByIdRequest,
    createEntitySimbaRequest,
    getMySimbaNotificationGroupCountRequest,
    manyNotificationSeenSimbaRequest,
    getMyNotificationsSimbaRequest,
};
