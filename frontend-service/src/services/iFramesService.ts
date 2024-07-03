import axios from '../axios';
import { environment } from '../globals';
import { IFrame, IMongoIFrame, ISearchIFramesBody } from '../interfaces/iFrames';

const { iFrames } = environment.api;

export const searchIFrames = async (query: ISearchIFramesBody) => {
    const { data } = await axios.post<IMongoIFrame[]>(`${iFrames}/search`, query);
    console.log({ data });

    return data;
};

export const getIFrameById = async (id: string) => {
    const { data } = await axios.get<IMongoIFrame>(`${iFrames}/${id}`);
    console.log({ data });

    return data;
};

export const createIFrame = async (iFrame: IFrame) => {
    const { data } = await axios.post<IMongoIFrame>(iFrames, iFrame);
    return data;
};

export const deleteIFrame = async (iFrameId: string) => {
    console.log({ iFrameId });

    const { data } = await axios.delete<IMongoIFrame>(`${iFrames}/${iFrameId}`);
    return data;
};

export const updateIFrame = async (id: string, iFrame: IFrame) => {
    const { data } = await axios.put<IMongoIFrame>(`${iFrames}/${id}`, iFrame);
    return data;
};
