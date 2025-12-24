import axios from '../axios';
import { IFrameWizardValues } from '../common/wizards/iFrame';
import { environment } from '../globals';
import { IMongoIFrame, ISearchIFramesBody } from '../interfaces/iFrames';
import { getFileName } from '../utils/getFileName';

const { iFrames } 


= environment.api;

const iFrameObjectToIFrameForm = (iFrame: IMongoIFrame | null): IFrameWizardValues | undefined => {
    if (!iFrame) return undefined;
    const { iconFileId, ...restOfIFrame } = iFrame;
    if (iconFileId) {
        const file: Partial<File> = { name: iconFileId };
        return { ...restOfIFrame, icon: { file, name: getFileName(iconFileId) } };
    }

    return restOfIFrame;
};

const searchIFrames = async (query: ISearchIFramesBody) => {
    const { data } = await axios.post<IMongoIFrame[]>(`${iFrames}/search`, query);
    return data;
};

const getIFrameById = async (id: string) => {
    const { data } = await axios.get<IMongoIFrame>(`${iFrames}/${id}`);
    return data;
};

const createIFrame = async ({ name, url, categoryIds, placeInSideBar, icon }: IFrameWizardValues, toDashboard: boolean = false) => {
    const formData = new FormData();

    if (icon) {
        formData.append('file', icon.file as File);
    }
    formData.append('name', name);
    formData.append('url', url);
    formData.append('categoryIds', JSON.stringify(categoryIds));
    formData.append('placeInSideBar', placeInSideBar?.toString() || 'false');

    const { data } = await axios.post<IMongoIFrame>(iFrames, formData, { params: { toDashboard } });
    return data;
};

const deleteIFrame = async (iFrameId: string, usedInDashboard?: boolean) => {
    const { data } = await axios.delete<IMongoIFrame>(`${iFrames}/${iFrameId}`, {
        params: {
            deleteReferenceDashboardItems: usedInDashboard,
        },
    });
    return data;
};

const updateIFrame = async (id: string, updatedIFrame: IFrameWizardValues) => {
    const formData = new FormData();

    const { name, url, categoryIds, placeInSideBar } = updatedIFrame;

    if (updatedIFrame.icon) {
        if (updatedIFrame.icon.file instanceof File) {
            formData.append('file', updatedIFrame.icon.file);
        } else {
            formData.append('iconFileId', updatedIFrame.icon.file.name!);
        }
    }
    formData.append('name', name);
    formData.append('url', url);
    formData.append('categoryIds', JSON.stringify(categoryIds));
    formData.append('placeInSideBar', placeInSideBar?.toString() || 'false');

    const { data } = await axios.put<IMongoIFrame>(`${iFrames}/${id}`, formData);
    return data;
};

export { iFrameObjectToIFrameForm, searchIFrames, getIFrameById, createIFrame, deleteIFrame, updateIFrame };
