import axios from '../axios';
import { environment } from '../globals';

const { config } = environment.api;

export interface BackendConfigState {
    matomoUrl: string;
    matomoSiteId: number;
    mapLayers: Record<string, string>;
    deleteEntitiesLimit: number;
}

const getBackendConfigRequest = async () => {
    const { data } = await axios.get<BackendConfigState>(config);
    return data;
};

export { getBackendConfigRequest };
