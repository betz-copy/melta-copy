import React, { useEffect } from 'react';
import i18next from 'i18next';

const Unavailable: React.FC<{ setTitle: React.Dispatch<React.SetStateAction<string>> }> = ({ setTitle }) => {
    useEffect(() => setTitle(i18next.t('pages.unavailable')), [setTitle]);

    return <div />;
};

export default Unavailable;
