import config from '../../config';
import DefaultExternalServiceApi from '../../utils/express/externalService';

const { url, timeout } = config.templateService;

export class TemplatesManagerService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: url, timeout });
    }
}
