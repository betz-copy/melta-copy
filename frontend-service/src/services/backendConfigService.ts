import axios from '../axios';
import { environment } from '../globals';
import { LayerProviderType } from '../pages/Map/BaseLayers';

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
        layers: { name: string; body: string; type: LayerProviderType; displayName: string }[];
        url: string;
        params: string;
        token: string;
        layerLinkTag: string;
        layerLinkSchema: string;
        outputSchema: string;
    };
    deleteEntitiesLimit: number;
    meltaUpdates: Record<string, string>;
    meltaUpdatesDescription: string;
    isOutsideDevelopment: boolean;
}

export const getBackendConfigRequest = async () => {
    const { data } = await axios.get<BackendConfigState>(config);
    return data;
};
