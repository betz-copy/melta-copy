import axios from '../../axios';
import { environment } from '../../globals';
import { IChildTemplate, IMongoChildTemplate, IMongoChildTemplatePopulated } from '../../interfaces/childTemplates';

const { childTemplates } = environment.api;

const createChildTemplate = async (newChildTemplate: IChildTemplate) => {
    const { data } = await axios.post<IMongoChildTemplate>(childTemplates, newChildTemplate);
    return data;
};

const updateChildTemplate = async (id: string, childTemplate: IChildTemplate) => {
    const { data } = await axios.put<IMongoChildTemplate>(`${childTemplates}/${id}`, childTemplate);
    return data;
};

const getAllChildTemplates = async () => {
    const { data } = await axios.get<IMongoChildTemplatePopulated[]>(childTemplates);
    return data;
};

const deleteChildTemplate = async (id: string) => {
    const { data } = await axios.delete<IMongoChildTemplate>(`${childTemplates}/${id}`);
    return data;
};

const updateChildTemplateStatusRequest = async (childTemplateId: string, disabledStatus: boolean) => {
    const { data } = await axios.patch<IMongoChildTemplatePopulated>(`${childTemplates}/${childTemplateId}/status`, {
        disabled: disabledStatus,
    });
    return data;
};

export { createChildTemplate, updateChildTemplate, getAllChildTemplates, deleteChildTemplate, updateChildTemplateStatusRequest };
