import { IMongoChildEntityTemplatePopulated } from '../interfaces/entityChildTemplates';
import axios from '../axios';
import { environment } from '../globals';
import { IMongoCategory } from '../interfaces/categories';
import { ICountSearchResult, ISearchEntitiesOfTemplateBody, ISearchResult } from '../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IMongoRelationshipTemplate } from '../interfaces/relationshipTemplates';

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

const getEntityChildTemplateByIdRequest = async (id: string) => {
    const { data } = await axios.get<IMongoChildEntityTemplatePopulated>(`${simbaRoutes}/templates/child/${id}`);
    return data;
};

const getAllTemplates = async () => {
    const { data } = await axios.get<IMongoChildEntityTemplatePopulated[]>(`${simbaRoutes}/all`);
    return data;
};

const getCurrentUserEntity = async (templateId: string, kartoffelId: string) => {
    const { data } = await axios.post<ISearchResult>(`${simbaRoutes}/entities/${templateId}`, {
        kartoffelId,
    });

    if (data.entities.length === 0) {
        return null;
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

const getAllRelationshipsTemplatesByUserTemplateId = async (userTemplateId: string) => {
    const { data } = await axios.get<IMongoRelationshipTemplate[]>(`${simbaRoutes}/relationships/${userTemplateId}`);

    return data;
};

const searchEntitiesOfTemplateSimbaRequest = async (templateId: string, simbaUserEntityId: string, searchBody: ISearchEntitiesOfTemplateBody) => {
    const { data } = await axios.post<ISearchResult>(`${simbaRoutes}/entities/search/template/${templateId}`, {
        userEntityId: simbaUserEntityId,
        ...searchBody,
    });
    return data;
};

export {
    getEntityChildTemplateByIdRequest,
    getAllTemplates,
    getAllSimbaTemplates,
    getCurrentUserEntity,
    countEntitiesOfTemplatesByUserEntityId,
    getAllRelationshipsTemplatesByUserTemplateId,
    searchEntitiesOfTemplateSimbaRequest,
};
