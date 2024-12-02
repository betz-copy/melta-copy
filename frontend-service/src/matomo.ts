import { createInstance } from '@datapunt/matomo-tracker-react';
import { useQuery } from 'react-query';
import { BackendConfigState, getBackendConfigRequest } from './services/backendConfigService';

const useMatomoInstance = () => {
    const { data: matomoConfig } = useQuery<BackendConfigState>('getBackendConfig', getBackendConfigRequest);

    if (!matomoConfig) {
        return null;
    }
    console.log(matomoConfig.matomoUrl);

    return createInstance({
        urlBase: matomoConfig.matomoUrl,
        siteId: matomoConfig.matomoSiteId,
    });
};

export default useMatomoInstance;
