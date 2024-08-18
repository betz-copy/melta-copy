import axios from 'axios';
import config from '../config';
import { IFrame } from '../express/iFrames/interface';

const {
    ganttService: { requestTimeout },
} = config;
export interface IMongoIFrame extends IFrame {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export interface ISearchIFramesBody {
    search?: string;
    limit: number;
    skip: number;
    ids?: string[];
}

export class IFramesService {
    static async getExternalSiteById(iFrameUrl: string) {
        const { data } = await axios.create({ baseURL: iFrameUrl, timeout: requestTimeout }).get<any>('/');

        return data;
    }
}
export { IFrame };
