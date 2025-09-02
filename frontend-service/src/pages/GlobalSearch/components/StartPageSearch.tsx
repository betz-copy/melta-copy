import { Grid } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { GlobalSearchBar } from '../../../common/EntitiesPage/Headline';
import { MeltaIcon } from '../../../common/MeltaIcon';
import { useWorkspaceStore } from '../../../stores/workspace';

const StartPageSearch: React.FC<{
    onSearch: (searchValue: string) => void;
}> = ({ onSearch }) => {
    const workspace = useWorkspaceStore((state) => state.workspace);

    return (
        <Grid container direction="column" alignItems="center" spacing={4} sx={{ marginTop: '15vh' }}>
            <Grid>
                <MeltaIcon
                    iconUrl={workspace?.logoFileId}
                    width="400px"
                    style={{ margin: '0.6rem', filter: 'drop-shadow(3px 3px 2px rgba(0, 0, 0, 0.5))' }}
                    expanded
                />
            </Grid>
            <Grid width="800px">
                <GlobalSearchBar
                    onSearch={onSearch}
                    placeholder={i18next.t('globalSearch.searchLabel')}
                    size="medium"
                    borderRadius="30px"
                    height="56px"
                    width="768px"
                    showAiButton
                />
            </Grid>
        </Grid>
    );
};

export default StartPageSearch;
