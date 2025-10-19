import config from '../config';
import DefaultExternalServiceApi from '../utils/express/externalService';

const {
    previewService: { url, baseRoute },
} = config;

export class PreviewService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: url });
    }

    async getFilePreview(path: string, contentType?: string): Promise<Buffer> {
        const { data } = await this.api.get(`${baseRoute}/${path}`, {
            responseType: 'arraybuffer',
            params: { contentType },
        });

        return Buffer.from(data);
    }
}
