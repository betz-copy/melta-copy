import MockAdapter from 'axios-mock-adapter';
import { TemplatesManagerService } from '../templates';

export const getMockAdapterTemplateManager = () => {
    return new MockAdapter(TemplatesManagerService.TemplateManagerAxiosApi);
};
