import axios from 'axios';
import config from '../../config';

const { url, requestTimeout } = config.templateService;

export class TemplatesManagerService {
    protected static TemplateManagerAxiosApi = axios.create({ baseURL: url, timeout: requestTimeout });
}
