import axios from '../axios';
import { environment } from '../globals';
import { LayerProviderType } from '../pages/Map/BaseLayers';

const { config } = environment.api;

export interface MeltaUpdatesConfig {
    details: Record<string, string>;
    description: string;
    display: boolean;
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
    getMapLayers: {
        layers: { name: string; body: string; type: LayerProviderType; displayName: string }[];
        url: string;
        capabilitiesUrl: string;
        params: Record<string, string>;
        token: string;
        layerLinkTag: string;
        capabilitiesLinkSchema: string;
        cesiumLinkSchema: string;
        outputSchema: string;
    };
    deleteEntitiesLimit: number;
    meltaUpdates: MeltaUpdatesConfig;
    isOutsideDevelopment: boolean;
    maxEntitiesToPrint: number;
}

export const getBackendConfigRequest = async () => {
    const { data } = await axios.get<BackendConfigState>(config);
    return data;
};
