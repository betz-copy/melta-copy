import { Close as CancelIcon, Delete, Edit as EditIcon, Check as SaveIcon } from '@mui/icons-material';
import { Box, CircularProgress, Grid, IconButton } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { BlueTitle } from '../../../common/BlueTitle';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { MeltaTooltip } from '../../../common/MeltaTooltip';
import { Swap } from '../../../common/Swap';
import { TopBarGrid } from '../../../common/TopBar';
import { environment } from '../../../globals';

interface IChartTopBar {
    edit: boolean;
    onEdit: () => void;
    onDelete: () => void;
    isLoading: boolean;
}

const ChartTopBar: React.FC<IChartTopBar> = ({ edit, onEdit, onDelete, isLoading }) => {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    return (
        <>
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
                                <Grid container justifyContent="space-between" width="fit-content">
                                    {isLoading ? (
                                        <Grid item container alignItems="center" justifyContent="space-around" width="8rem">
                                            <CircularProgress size={30} />
                                        </Grid>
                                    ) : (
                                        <Grid item container>
                                            <MeltaTooltip title={i18next.t('actions.delete')}>
                                                <IconButton onClick={() => setDeleteDialogOpen(true)}>
                                                    <Delete />
                                                </IconButton>
                                            </MeltaTooltip>
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
            <AreYouSureDialog open={deleteDialogOpen} handleClose={() => setDeleteDialogOpen(false)} onYes={() => onDelete()} />
        </>
    );
};

export { ChartTopBar };
