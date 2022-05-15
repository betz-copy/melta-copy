import React, { useEffect } from 'react';
import i18next from 'i18next';

const Home: React.FC<{ setTitle: React.Dispatch<React.SetStateAction<string>> }> = ({ setTitle }) => {
    useEffect(() => setTitle(i18next.t('pages.home')), [setTitle]);
    return <div />;
};

export default Home;
