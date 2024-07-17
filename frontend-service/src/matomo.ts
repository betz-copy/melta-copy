import { createInstance } from '@datapunt/matomo-tracker-react';
import { environment } from './globals';

const matomoInstance = createInstance({
    urlBase: environment.matomo.urlBase,
    siteId: environment.matomo.siteId,
});

export default matomoInstance;
