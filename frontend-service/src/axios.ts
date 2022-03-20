import axiosInstance from 'axios';
import MockAdapter from 'axios-mock-adapter';
import cookies from 'js-cookie';
import { environment } from './globals';
import { mockCategories } from './mocks/categories';
import { mockConfig } from './mocks/config';
import { mockEntites } from './mocks/entities';
import { mockEntityTemplates } from './mocks/entityTemplates';
import { mockRelationshipTemplates } from './mocks/relationshipTemplates';
import { AuthService } from './services/authService';
// import faker from 'faker';

const axios = axiosInstance.create({
    withCredentials: true,
    timeout: 5000,
    baseURL: '/api',
});

axios.interceptors.request.use(
    async (config) => {
        const accessToken = cookies.get(environment.accessTokenName);
        if (accessToken) {
            // eslint-disable-next-line no-param-reassign
            config.headers!.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => {
        Promise.reject(error);
    },
);

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
}

export default axios;
