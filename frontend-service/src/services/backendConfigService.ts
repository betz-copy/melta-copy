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
    mapLayers: Record<string, string>;
    textLayers: Record<string, string>;
    getMapLayers: {
        url: string, 
        params: string, 
        body: string, 
        token: string
    },
    deleteEntitiesLimit: number;
    meltaUpdates: Record<string, string>;
    meltaUpdatesDescription: string;
    isOutsideDevelopment: boolean;
}

export const getBackendConfigRequest = async () => {
    const { data } = await axios.get<BackendConfigState>(config);
    return data;
};
