import axios from 'axios';
import config from '../../config';

const { url, timeout } = config.templateService;

export class TemplatesManagerService {
    static TemplateManagerAxiosApi = axios.create({ baseURL: url, timeout });
}
