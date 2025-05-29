import axios from '../axios';
import { environment } from '../globals';
import { ISearchResult } from '../interfaces/entities';
import { IMongoChildEntityTemplatePopulated } from '../interfaces/entityChildTemplates';

const { simbaRoutes } = environment.api;

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

export { getEntityChildTemplateByIdRequest, getAllTemplates, getCurrentUserEntity };
