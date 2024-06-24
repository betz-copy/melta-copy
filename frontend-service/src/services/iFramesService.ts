import axios from '../axios';
import { environment } from '../globals';
import { IFrame, ISearchIFramesBody } from '../interfaces/iFrames';

const { iFrames } = environment.api;

export const searchIFrames = async (query: ISearchIFramesBody) => {
    const { data } = await axios.post<IFrame[]>(`${iFrames}/search`, query);
    return data;
};

export const getIFrameById = async (id: string) => {
    const { data } = await axios.get<IFrame>(`${iFrames}/${id}`);
    return data;
};

export const createIFrame = async (iFrame: IFrame) => {
    const { data } = await axios.post<IFrame>(iFrames, iFrame);
    return data;
};

export const deleteIFrame = async (iFrameId: string) => {
    const { data } = await axios.delete<IFrame>(`${iFrames}/${iFrameId}`);
    return data;
};

export const updateIFrame = async (id: string, iFrame: IFrame) => {
    const { data } = await axios.put<IFrame>(`${iFrames}/${id}`, iFrame);
    return data;
};
