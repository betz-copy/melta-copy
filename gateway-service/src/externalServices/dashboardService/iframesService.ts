import config from '../../config';
import DefaultExternalServiceApi from '../../utils/express/externalService';

const {
    dashboardService: { url, baseRoute, requestTimeout, iframes },
} = config;

export interface IFrame {
    name: string;
    url: string;
    categoryIds: string[];
    iconFileId: string | null;
    placeInSideBar?: boolean;
}

export interface IFrameDocument extends IFrame {
    _id: string;
}

export interface ISearchIFramesBody {
    search?: string;
    limit: number;
    skip: number;
    ids?: string[];
}

export class IFramesService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: `${url}${baseRoute}${iframes.baseRoute}`, timeout: requestTimeout });
    }

    async searchIFrames({ search, limit, skip, ids }: ISearchIFramesBody): Promise<IFrameDocument[]> {
        const { data } = await this.api.post<IFrameDocument[]>('/search', { search, limit, skip, ids });
        return data;
    }

    async getIFrameById(iframeId: string): Promise<IFrameDocument> {
        const { data } = await this.api.get<IFrameDocument>(`/${iframeId}`);
        return data;
    }

    async createIFrame(iframe: IFrame): Promise<IFrameDocument> {
        const { data } = await this.api.post('/', iframe);
        return data;
    }

    async updateIFrame(
        iframeId: string,
        iframe: Partial<IFrame> & {
            file?: string;
        },
    ): Promise<IFrameDocument> {
        const { data } = await this.api.put(`/${iframeId}`, iframe);
        return data;
    }

    async deleteIFrame(iframeId: string): Promise<void> {
        await this.api.delete(`/${iframeId}`);
    }
}
