import { Close as CancelIcon, Edit as EditIcon, Check as SaveIcon } from '@mui/icons-material';
import { Box, CircularProgress, Grid, IconButton } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { BlueTitle } from '../../../common/BlueTitle';
import { MeltaTooltip } from '../../../common/MeltaTooltip';
import { Swap } from '../../../common/Swap';
import { TopBarGrid } from '../../../common/TopBar';
import { environment } from '../../../globals';
import { useDarkModeStore } from '../../../stores/darkMode';

interface IChartTopBar {
    edit: boolean;
    onEdit: () => void;
    isLoading: boolean;
}

const ChartTopBar: React.FC<IChartTopBar> = ({ edit, onEdit, isLoading }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <TopBarGrid container alignItems="center" wrap="nowrap" sx={{ marginBottom: 0, paddingRight: '1.6rem' }}>
            <Box>
                <BlueTitle
                    title={i18next.t('charts.chart')}
                    component="h4"
                    variant="h4"
                    style={{ fontSize: environment.mainFontSizes.headlineTitleFontSize }}
                />
            </Box>
            <Grid item container wrap="nowrap" flexDirection="row-reverse" marginLeft="auto">
                <Swap
                    condition={edit}
                    isFalse={
                        <MeltaTooltip title={i18next.t('actions.edit')}>
                            <IconButton onClick={onEdit}>
                                <EditIcon />
                            </IconButton>
                        </MeltaTooltip>
                    }
                    isTrue={
                        <Grid container justifyContent="space-between" alignItems="center" width="fit-content" wrap="nowrap">
                            <Grid
                                container
                                justifyContent="space-between"
                                width="fit-content"
                                wrap="nowrap"
                                bgcolor={`rgb(220, 220, 220, ${darkMode ? 0.15 : 0.5})`}
                                borderRadius="10px"
                                padding="0.1rem"
                            >
                                {isLoading ? (
                                    <Grid item container alignItems="center" justifyContent="space-around" width="8rem">
                                        <CircularProgress size={30} />
                                    </Grid>
                                ) : (
                                    <Grid
                                        item
                                        container
                                        wrap="nowrap"
                                        bgcolor={`rgb(220, 220, 220, ${darkMode ? 0.12 : 0.7})`}
                                        borderRadius="10px"
                                        margin="0.2rem"
                                    >
                                        <MeltaTooltip title={i18next.t('actions.cancel')}>
                                            <IconButton type="reset">
                                                <CancelIcon />
                                            </IconButton>
                                        </MeltaTooltip>
                                        <MeltaTooltip title={i18next.t('actions.save')}>
                                            <IconButton type="submit">
                                                <SaveIcon />
                                            </IconButton>
                                        </MeltaTooltip>
                                    </Grid>
                                )}
                            </Grid>
                        </Grid>
                    }
                />
            </Grid>
        </TopBarGrid>
    );
};

export { ChartTopBar };
