import axios from 'axios';
import config from '../config';

const {
    ganttService: { requestTimeout },
} = config;

export interface IFrame {
    name: string;
    url: string;
    categoryIds: string[];
    height?: number;
    width?: number;
    placeInSideBar?: boolean;
}

export interface IMongoIFrame extends IFrame {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export interface ISearchIFramesBody {
    search?: string;
    limit: number;
    step: number;
}

export class IFramesService {
    static async getExternalSiteById(iFrameUrl: string) {
        const { data } = await axios.create({ baseURL: iFrameUrl, timeout: requestTimeout }).get<any>('/');

        return data;
    }
}
