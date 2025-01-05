import axios from '../axios';
import { environment } from '../globals';

const { config } = environment.api;

export interface BackendConfigState {
    matomoUrl: string;
    matomoSiteId: number;
    excel: {
        entitiesFileLimit: number;
        filesLimit: number;
    };
}

export const getBackendConfigRequest = async () => {
    const { data } = await axios.get<BackendConfigState>(config);
    return data;
};
