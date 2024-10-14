import { createInstance } from '@datapunt/matomo-tracker-react';
import { environment } from './globals';

const matomoInstance = createInstance({
    urlBase: environment.staticConfigs.matomo.urlBase,
    siteId: environment.staticConfigs.matomo.siteId,
});
export default matomoInstance;
