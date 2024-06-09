import axios from 'axios';
import config from '../config';

const {
    ganttService: { url, iFramesBaseRoute: baseRoute, requestTimeout },
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
    private static iFramesServiceApi = axios.create({ baseURL: url, timeout: requestTimeout });

    static async searchIFrames(searchBody: ISearchIFramesBody) {
        const { data } = await this.iFramesServiceApi.post<IMongoIFrame[]>(`${baseRoute}/search`, searchBody);
        return data;
    }

    static async getIFrameById(iFrameId: string) {
        const { data } = await this.iFramesServiceApi.get<IMongoIFrame>(`${baseRoute}/${iFrameId}`);
        return data;
    }

    static async createIFrame(iFrame: IFrame) {
        const { data } = await this.iFramesServiceApi.post<IMongoIFrame>(baseRoute, iFrame);
        return data;
    }

    static async deleteIFrame(iFrameId: string) {
        const { data } = await this.iFramesServiceApi.delete<IMongoIFrame>(`${baseRoute}/${iFrameId}`);
        return data;
    }

    static async updateIFrame(iFrameId: string, iFrame: IFrame) {
        const { data } = await this.iFramesServiceApi.put<IMongoIFrame>(`${baseRoute}/${iFrameId}`, iFrame);
        return data;
    }
}
