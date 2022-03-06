import axios from '../axios';
import { environment } from '../globals';

const { config } = environment.api;

export interface BackendConfigState {
    contactByMailLink: string;
    contactByChatLink: string;
}

const getBackendConfigRequest = async () => {
    const { data } = await axios.get<BackendConfigState>(config);
    return data;
};

export { getBackendConfigRequest };
