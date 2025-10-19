import { createInstance } from '@datapunt/matomo-tracker-react';
import { useQueryClient } from 'react-query';
import { BackendConfigState } from './services/backendConfigService';
import { useUserStore } from './stores/user';

export const useMatomoInstance = () => {
    const queryClient = useQueryClient();
    const currentUser = useUserStore((state) => state.user);

    const matomoConfig = queryClient.getQueryData<BackendConfigState>('getBackendConfig');

    if (!matomoConfig) {
        return null;
    }

    if (process.env.NODE_ENV === 'development') {
        return null;
    }

    return createInstance({
        urlBase: matomoConfig.matomoUrl,
        siteId: matomoConfig.matomoSiteId,
        userId: `${currentUser.fullName} - ${currentUser.kartoffelId}`,
    });
};
