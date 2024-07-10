import { mapValues } from 'lodash';
import axios from '../axios';
import { IFrameWizardValues } from '../common/wizards/iFrame';
import { environment } from '../globals';
import { IMongoIFrame, ISearchIFramesBody } from '../interfaces/iFrames';
import { getFileName } from '../utils/getFileName';

const { iFrames } = environment.api;

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

const createIFrame = async (newIFrame: IFrameWizardValues) => {
    const { data } = await axios.post<IMongoIFrame>(iFrames, newIFrame);

    return data;
};

const deleteIFrame = async (iFrameId: string) => {
    const { data } = await axios.delete<IMongoIFrame>(`${iFrames}/${iFrameId}`);

    return data;
};

const updateIFrame = async (id: string, updatedIFrame: IFrameWizardValues) => {
    const formData = new FormData();
    console.log('shirel ', { updatedIFrame });

    const { name, url, categoryIds, description, apiToken, placeInSideBar } = updatedIFrame;
    if (updatedIFrame.icon) {
        if (updatedIFrame.icon.file instanceof File) {
            formData.append('file', updatedIFrame.icon.file);
        } else {
            formData.append('iconFileId', updatedIFrame.icon.file.name!);
        }
    }

    formData.append('name', name);
    formData.append('url', url);

    if (categoryIds) formData.append('categoryIds', JSON.stringify(categoryIds));
    if (description) formData.append('description', description);
    if (apiToken) formData.append('apiToken', apiToken);
    if (placeInSideBar) formData.append('placeInSideBar', placeInSideBar.toString());
    console.log(...formData, placeInSideBar);

    const { data } = await axios.put<IMongoIFrame>(`${iFrames}/${id}`, formData);
    console.log({ data });

    return data;
};

export { iFrameObjectToIFrameForm, searchIFrames, getIFrameById, createIFrame, deleteIFrame, updateIFrame };
