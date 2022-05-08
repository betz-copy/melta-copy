import axiosInstance from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { mockCategories } from './mocks/categories';
import { mockConfig } from './mocks/config';
import { mockEntites } from './mocks/entities';
import { mockRelationships } from './mocks/relationships';
import { mockEntityTemplates } from './mocks/entityTemplates';
import { mockRelationshipTemplates } from './mocks/relationshipTemplates';
import { AuthService } from './services/authService';
import { mockPermissions } from './mocks/permissions';
// import faker from 'faker';

const axios = axiosInstance.create({
    withCredentials: true,
    timeout: 5000,
    baseURL: '/api',
});

axios.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response.status === 401) {
            AuthService.logout();
        }

        return Promise.reject(error);
    },
);

if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_IS_DOCKER) {
    console.log('Development Environment, using axios mock');

    const mock = new MockAdapter(axios, { delayResponse: 500 });

    mockConfig(mock);

    mockCategories(mock);

    mockEntityTemplates(mock);

    mockRelationshipTemplates(mock);

    mockEntites(mock);

    mockRelationships(mock);

    mockPermissions(mock);
}

export default axios;
