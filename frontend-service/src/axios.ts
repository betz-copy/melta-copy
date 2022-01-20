import axiosInstance from 'axios';
import MockAdapter from 'axios-mock-adapter';
import useAxios, { configure } from 'axios-hooks';
import cookies from 'js-cookie';
import { environment } from './globals';
import { AuthService } from './services/authService';
// import faker from 'faker';

const axios = axiosInstance.create({
    withCredentials: true,
    timeout: 5000,
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

    mock.onGet('/api/config').reply(() => [
        200,
        {
            contactByMailLink: 'mailAdr@gmail.com',
            contactByChatLink: 'http://chat.com',
        },
    ]);
}

configure({ axios });

export { useAxios };

export default axios;
