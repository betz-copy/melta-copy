/* eslint-disable global-require */
import axiosInstance from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { AuthService } from './services/authService';
// import faker from 'faker';

const axios = axiosInstance.create({
    withCredentials: true,
    timeout: 10000,
    baseURL: '/api',
});

axios.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            AuthService.logout();
        }

        return Promise.reject(error);
    },
);

if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_IS_DOCKER) {
    console.log('Development Environment, using axios mock');

    const { mockCategories } = require('./mocks/templates/categories');
    const { mockGetAllTemplates } = require('./mocks/templates/getAllTemplates');
    const { mockConfig } = require('./mocks/config');
    const { mockEntites } = require('./mocks/entities');
    const { mockEntityTemplates } = require('./mocks/templates/entityTemplates');
    const { mockRelationshipTemplates } = require('./mocks/templates/relationshipTemplates');
    const { mockRelationships } = require('./mocks/relationships');
    const { mockPermissions } = require('./mocks/permissions');
    const { mockActivityLog } = require('./mocks/entities/activityLog');

    const mock = new MockAdapter(axios, { delayResponse: 500 });

    mockConfig(mock);

    mockGetAllTemplates(mock);

    mockCategories(mock);

    mockEntityTemplates(mock);

    mockRelationshipTemplates(mock);

    mockEntites(mock);

    mockRelationships(mock);

    mockPermissions(mock);

    mockActivityLog(mock);
}

export default axios;
