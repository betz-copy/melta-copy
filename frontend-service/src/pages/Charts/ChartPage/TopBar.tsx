import { Close as CancelIcon, Delete, Edit as EditIcon, Check as SaveIcon } from '@mui/icons-material';
import { Box, CircularProgress, Grid, IconButton, useTheme } from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React, { useState } from 'react';
import { BlueTitle } from '../../../common/BlueTitle';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { MeltaTooltip } from '../../../common/MeltaTooltip';
import { TopBarGrid } from '../../../common/TopBar';
import { environment } from '../../../globals';
import { IBasicChart } from '../../../interfaces/charts';
import { isWorkspaceAdmin } from '../../../utils/permissions/instancePermissions';
import { useUserStore } from '../../../stores/user';

interface IChartTopBar {
    edit: boolean;
    readonly: boolean;
    onEdit: () => void;
    onDelete: () => void;
    isLoading: boolean;
    setReadOnly: React.Dispatch<React.SetStateAction<boolean>>;
    formik: FormikProps<IBasicChart>;
}

const ChartTopBar: React.FC<IChartTopBar> = ({ edit, onEdit, onDelete, isLoading, readonly, setReadOnly, formik }) => {
    const theme = useTheme();
    const currentUser = useUserStore();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    return (
        <Box>
            <TopBarGrid container alignItems="center" wrap="nowrap" sx={{ marginBottom: 0, paddingRight: '1.6rem' }}>
                <Grid>
                    <BlueTitle
                        title={`${i18next.t(edit ? 'actions.editment' : 'actions.createment')} ${i18next.t('charts.chart')}`}
                        component="h4"
                        variant="h4"
                        style={{ fontSize: environment.mainFontSizes.headlineTitleFontSize, whiteSpace: 'nowrap' }}
                    />
                </Grid>

                <Grid item container wrap="nowrap" flexDirection="row-reverse" marginLeft="auto">
                    {readonly ? (
                        <MeltaTooltip title={i18next.t('actions.edit')}>
                            <IconButton onClick={onEdit} sx={{ color: theme.palette.primary.main }}>
                                <EditIcon />
                            </IconButton>
                        </MeltaTooltip>
                    ) : (
                        <Grid container justifyContent="space-between" alignItems="center" width="fit-content" wrap="nowrap">
                            {isLoading ? (
                                <Grid item container alignItems="center" justifyContent="space-around" width="8rem">
                                    <CircularProgress size={30} />
                                </Grid>
                            ) : (
                                <Grid item container>
                                    {edit && (
                                        <MeltaTooltip title={i18next.t('actions.cancel')}>
                                            <IconButton
                                                type="reset"
                                                onClick={() => {
                                                    formik.resetForm();
                                                    setReadOnly(true);
                                                }}
                                                sx={{ color: theme.palette.primary.main }}
                                                disabled={!edit}
                                            >
                                                <CancelIcon />
                                            </IconButton>
                                        </MeltaTooltip>
                                    )}
                                    <MeltaTooltip title={i18next.t('actions.save')}>
                                        <IconButton type="submit" disabled={!formik.dirty} sx={{ color: theme.palette.primary.main }}>
                                            <SaveIcon />
                                        </IconButton>
                                    </MeltaTooltip>
                                </Grid>
                            )}
                        </Grid>
                    )}

                    {edit && (formik.values.createdBy === currentUser.user._id || isWorkspaceAdmin(currentUser.user.currentWorkspacePermissions)) && (
                        <MeltaTooltip title={i18next.t('actions.delete')}>
                            <IconButton onClick={() => setDeleteDialogOpen(true)} sx={{ color: theme.palette.primary.main }}>
                                <Delete />
                            </IconButton>
                        </MeltaTooltip>
                    )}
                </Grid>
            </TopBarGrid>

            <AreYouSureDialog open={deleteDialogOpen} handleClose={() => setDeleteDialogOpen(false)} onYes={onDelete} />
        </Box>
    );
};

export { ChartTopBar };
