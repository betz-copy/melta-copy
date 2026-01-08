import axios from '../axios';
import { environment } from '../globals';

const { config } = environment.api;

export interface MeltaUpdatesConfig {
    details: Record<string, string>;
    description: string;
    shouldShow: boolean;
}

export interface BackendConfigState {
    matomoUrl: string;
    matomoSiteId: number;
    excel: {
        entitiesFileLimit: number;
        filesLimit: number;
    };
    mapLayers: Record<string, string>;
    textLayers: Record<string, string>;
    deleteEntitiesLimit: number;
    meltaUpdates: MeltaUpdatesConfig;
    isOutsideDevelopment: boolean;
    maxEntitiesToPrint: number;
}

export const getBackendConfigRequest = async () => {
    const { data } = await axios.get<BackendConfigState>(config);
    return data;
};
