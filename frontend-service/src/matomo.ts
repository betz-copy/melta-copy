import { createInstance } from '@datapunt/matomo-tracker-react';
import { useQuery } from 'react-query';
import { BackendConfigState, getBackendConfigRequest } from './services/backendConfigService';

export const useMatomoInstance = () => {
    const { data: matomoConfig } = useQuery<BackendConfigState>('getBackendConfig', getBackendConfigRequest);
    console.log(matomoConfig);

    if (!matomoConfig) {
        return null;
    }

    return createInstance({
        urlBase: matomoConfig!.matomoUrl,
        siteId: matomoConfig!.matomoSiteId,
    });
};
