import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import hebrew from './hebrew';

const resources = {
    he: {
        translation: hebrew,
    },
};

i18next.use(initReactI18next).init({
    resources,
    lng: 'he',
    interpolation: {
        escapeValue: false,
    },
});
