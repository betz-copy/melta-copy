import i18next from 'i18next';
import React, { useEffect } from 'react';

const Unavailable: React.FC<{ setTitle: React.Dispatch<React.SetStateAction<string>> }> = ({ setTitle }) => {
    useEffect(() => setTitle(i18next.t('pages.unavailable')), [setTitle]);

    return <div />;
};

export default Unavailable;
