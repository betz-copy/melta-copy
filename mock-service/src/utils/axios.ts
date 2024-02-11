import axios from 'axios';
import config from '../config';

// axios instance with a database header from config
export const Axios = axios.create({
    headers: {
        [config.service.dbHeaderName]: config.service.dbMockName,
    },
});
