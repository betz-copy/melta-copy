import config from '../../config';
import DefaultExternalServiceApi from '../../utils/express/externalService';

const { url, timeout } = config.templateService;

export class TemplatesManagerService extends DefaultExternalServiceApi {
    constructor(dbName: string) {
        super(dbName, { baseURL: url, timeout });
    }
}
