import { createInstance } from '@datapunt/matomo-tracker-react';

const matomoInstance = createInstance({
    urlBase: 'matomo.yesodot.services.idf',
    siteId: 24, 
});

export default matomoInstance;