import axios from '../axios';
import { environment } from '../globals';
import { IMetadata, IWorkspace } from '../interfaces/workspaces';
import { WorkspaceWizardValues } from '../pages/DirView/Wizard';

const {
    api: { workspaces },
} = environment;

export const getDir = async (path: IWorkspace['path']) => {
    const { data } = await axios.post<IWorkspace[]>(`${workspaces}/dir`, { path });
    return data;
};

export const getFile = async (path: IWorkspace['path']) => {
    const { data } = await axios.post<IWorkspace>(`${workspaces}/file`, { path });
    return data;
};

export const getById = async (id: string) => {
    const { data } = await axios.get<IWorkspace>(`${workspaces}/${id}`);
    return data;
};

export const getWorkspaceHierarchyIds = async (id: string) => {
    const { data } = await axios.get<string[]>(`${workspaces}/${id}/ids/hierarchy`);
    return data;
};

const generateFormData = (workspace: WorkspaceWizardValues, appendFiles: (formData: FormData) => void) => {
    const formData = new FormData();

    Object.entries(workspace).forEach(([key, value]) => {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
    });

    appendFiles(formData);

    return formData;
};

export const createOne = async (workspaceValues: WorkspaceWizardValues) => {
    const { icon, logo, ...workspace } = workspaceValues;

    const formData = generateFormData(workspace, (currentFormData) => {
        if (icon) currentFormData.append('iconFileId', icon.file as File);
        if (logo) currentFormData.append('logoFileId', logo.file as File);
    });

    const { data } = await axios.post<IWorkspace>(`${workspaces}/`, formData);
    return data;
};

export const updateOne = async (id: string, workspaceValues: WorkspaceWizardValues & { path: string }) => {
    const { icon, logo, metadata: _m, ...workspace } = workspaceValues;

    const formData = generateFormData(workspace, (currentFormData) => {
        if (icon) currentFormData.append('iconFileId', icon.file instanceof File ? icon.file : icon.file.name!);
        if (logo) currentFormData.append('logoFileId', logo.file instanceof File ? logo.file : logo.file.name!);
    });

    const { data } = await axios.put<IWorkspace>(`${workspaces}/${id}`, formData);
    return data;
};

export const updateMetadata = async (id: string, updatedMetadata: Partial<IMetadata> = {}) => {
    const metadataToSend = updatedMetadata || {};
    const { data } = await axios.patch<IWorkspace>(`${workspaces}/${id}/metadata`, metadataToSend);
    return data;
};
