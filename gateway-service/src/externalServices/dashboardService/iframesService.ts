import { IFrame, IMongoIframe, ISearchIFramesBody } from '@packages/iframe';
import config from '../../config';
import DefaultExternalServiceApi from '../../utils/express/externalService';

const {
    dashboardService: { url, baseRoute, requestTimeout, iframes },
} = config;

class IFramesService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: `${url}${baseRoute}${iframes.baseRoute}`, timeout: requestTimeout });
    }

    async searchIFrames({ search, limit, skip, ids }: ISearchIFramesBody): Promise<IMongoIframe[]> {
        const { data } = await this.api.post<IMongoIframe[]>('/search', { search, limit, skip, ids });
        return data;
    }

    async getIFrameById(iframeId: string): Promise<IMongoIframe> {
        const { data } = await this.api.get<IMongoIframe>(`/${iframeId}`);
        return data;
    }

    async createIFrame(iframe: IFrame): Promise<IMongoIframe> {
        const { data } = await this.api.post('/', iframe);
        return data;
    }

    async updateIFrame(
        iframeId: string,
        iframe: Partial<IFrame> & {
            file?: string;
        },
    ): Promise<IMongoIframe> {
        const { data } = await this.api.put(`/${iframeId}`, iframe);
        return data;
    }

    async deleteIFrame(iframeId: string): Promise<void> {
        await this.api.delete(`/${iframeId}`);
    }
}

export default IFramesService;
