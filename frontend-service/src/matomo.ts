import { createInstance } from '@datapunt/matomo-tracker-react';
import { useQueryClient } from 'react-query';
import { BackendConfigState } from './services/backendConfigService';

export const useMatomoInstance = () => {
    const queryClient = useQueryClient();
    const matomoConfig = queryClient.getQueryData<BackendConfigState>('getBackendConfig')!;

    if (!matomoConfig) {
        return null;
    }

    return createInstance({
        urlBase: matomoConfig!.matomoUrl,
        siteId: matomoConfig!.matomoSiteId,
    });
};
