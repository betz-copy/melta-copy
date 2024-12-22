/* eslint-disable no-param-reassign */
import axiosInstance from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { StatusCodes } from 'http-status-codes';
import { environment } from './globals';
import { AuthService } from './services/authService';
import { useWorkspaceStore } from './stores/workspace';

const axios = axiosInstance.create({
    withCredentials: true,
    timeout: 1800000,
    baseURL: '/api',
});

axios.interceptors.request.use((config) => {
    const { workspace } = useWorkspaceStore.getState();

    if (!config.headers) config.headers = {};
    config.headers[environment.workspaceIdHeaderName] = workspace._id;

    return config;
});

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === StatusCodes.UNAUTHORIZED) {
            AuthService.logout();
        }

        return Promise.reject(error);
    },
);

if (import.meta.env.DEV && !import.meta.env.VITE_APP_IS_DOCKER) {
    console.log('Development Environment, using axios mock');

    const [
        { mockCategories },
        { mockGetAllTemplates },
        // { mockConfig },
        { mockEntites },
        { mockEntityTemplates },
        { mockRelationshipTemplates },
        { mockRules },
        { mockRelationships },
        { mockPermissions },
        { mockActivityLog },
        { mockNotifications },
        { mockRuleBreaches },
        { mockProcessInstances },
        { mockProcessTemplates },
        { mockGantts },
    ] = await Promise.all([
        import('./mocks/templates/categories'),
        import('./mocks/templates/getAllTemplates'),
        // import('./mocks/config'),
        import('./mocks/entities'),
        import('./mocks/templates/entityTemplates'),
        import('./mocks/templates/relationshipTemplates'),
        import('./mocks/templates/rules'),
        import('./mocks/relationships'),
        import('./mocks/permissions'),
        import('./mocks/entities/activityLog'),
        import('./mocks/notifications'),
        import('./mocks/ruleBreaches'),
        import('./mocks/processInstances'),
        import('./mocks/templates/processTemplates'),
        import('./mocks/gantts'),
    ]);

    const mock = new MockAdapter(axios, { delayResponse: 500 });

    // mockConfig(mock);
    mockGetAllTemplates(mock);
    mockCategories(mock);
    mockEntityTemplates(mock);
    mockRelationshipTemplates(mock);
    mockProcessTemplates(mock);

    mockRules(mock);
    mockEntites(mock);
    mockRelationships(mock);
    mockPermissions(mock);
    mockActivityLog(mock);
    mockNotifications(mock);
    mockRuleBreaches(mock);
    mockProcessInstances(mock);
    mockGantts(mock);
}

export default axios;
