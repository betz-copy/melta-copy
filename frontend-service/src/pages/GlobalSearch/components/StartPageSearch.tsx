import { Grid } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { GlobalSearchBar } from '../../../common/EntitiesPage/Headline';

const StartPageSearch: React.FC<{
    onSearch: (searchValue: string) => void;
}> = ({ onSearch }) => {
    return (
        <Grid container direction="column" alignItems="center" spacing={4} sx={{ marginTop: '15vh' }}>
            <Grid item>
                <img src="/icons/Melta_Google_Logo.svg" style={{ margin: '0.6rem', color: 'black' }} width="400px" />
            </Grid>
            <Grid item width="800px">
                <GlobalSearchBar onSearch={onSearch} placeholder={i18next.t('globalSearch.searchLabel')} size="medium" borderRadius="30px" />
            </Grid>
        </Grid>
    );
};

export default StartPageSearch;
