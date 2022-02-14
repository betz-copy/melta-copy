import axios from '../axios';
import { environment } from '../globals';
import { BackendConfigState } from '../store/backendConfig';

const { config } = environment.api;

const getBackendConfigRequest = async () => {
    const { data } = await axios.get<BackendConfigState>(config);
    return data;
};

export { getBackendConfigRequest };
