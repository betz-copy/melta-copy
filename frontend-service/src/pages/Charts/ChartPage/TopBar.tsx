import { Close as CancelIcon, Delete, Edit as EditIcon, Check as SaveIcon } from '@mui/icons-material';
import { Box, CircularProgress, Grid, useTheme } from '@mui/material';
import { IChart } from '@packages/chart';
import { IGraphFilterBodyBatch } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React, { useState } from 'react';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import BlueTitle from '../../../common/MeltaDesigns/BlueTitle';
import { TopBarGrid } from '../../../common/TopBar';
import { useUserStore } from '../../../stores/user';
import { useWorkspaceStore } from '../../../stores/workspace';
import { isWorkspaceAdmin } from '../../../utils/permissions/instancePermissions';
import { FilterOfGraphToFilterRecord } from '../../Graph/GraphFilterToBackend';

interface IChartTopBar {
    edit: boolean;
    readonly: boolean;
    onDelete: () => void;
    isLoading: boolean;
    setReadOnly: React.Dispatch<React.SetStateAction<boolean>>;
    formik: FormikProps<IChart>;
    template: IMongoEntityTemplateWithConstraintsPopulated;
    filterRecord: IGraphFilterBodyBatch;
    setFilterRecord: React.Dispatch<React.SetStateAction<IGraphFilterBodyBatch>>;
    setFilters: React.Dispatch<React.SetStateAction<number[]>>;
}

const ChartTopBar: React.FC<IChartTopBar> = ({
    edit,
    onDelete,
    isLoading,
    readonly,
    setReadOnly,
    formik,
    template,
    filterRecord,
    setFilterRecord,
    setFilters,
}) => {
    const theme = useTheme();
    const currentUser = useUserStore();
    const workspace = useWorkspaceStore((state) => state.workspace);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const hasEditAndDeletePermission =
        formik.values.createdBy === currentUser.user._id || isWorkspaceAdmin(currentUser.user.currentWorkspacePermissions);

    return (
        <Box>
            <TopBarGrid
                container
                alignItems="center"
                wrap="nowrap"
                sx={{ marginBottom: 0, paddingRight: '1.6rem', boxShadow: '  -2px 2px 6px 0px #1E277533' }}
            >
                <Grid>
                    <BlueTitle
                        title={`${i18next.t(`actions.${edit ? 'edit' : 'create'}ment`)} ${i18next.t('charts.chart')}`}
                        component="h4"
                        variant="h4"
                        style={{ fontSize: workspace.metadata.mainFontSizes.headlineTitleFontSize, whiteSpace: 'nowrap' }}
                    />
                </Grid>

                <Grid container wrap="nowrap" flexDirection="row-reverse" marginLeft="auto">
                    {readonly ? (
                        <IconButtonWithPopover
                            popoverText={hasEditAndDeletePermission ? i18next.t('actions.edit') : i18next.t('charts.dontHavePermissionToEditChart')}
                            disabled={!hasEditAndDeletePermission}
                            iconButtonProps={{ onClick: () => setReadOnly(false) }}
                            buttonStyle={{ color: theme.palette.primary.main }}
                        >
                            <EditIcon />
                        </IconButtonWithPopover>
                    ) : (
                        <Grid container justifyContent="space-between" alignItems="center" width="fit-content" wrap="nowrap">
                            {isLoading ? (
                                <Grid container alignItems="center" justifyContent="space-around" width="8rem">
                                    <CircularProgress size={30} />
                                </Grid>
                            ) : (
                                <Grid container>
                                    {edit && (
                                        <IconButtonWithPopover
                                            popoverText={i18next.t('actions.cancel')}
                                            iconButtonProps={{
                                                onClick: () => {
                                                    formik.resetForm();
                                                    if (edit && formik.values.filter) {
                                                        const parsedFilter = JSON.parse(formik.values.filter);
                                                        const translatedFilter = FilterOfGraphToFilterRecord(parsedFilter, template);
                                                        setFilterRecord({ ...translatedFilter });
                                                        setFilters(Object.keys(translatedFilter).map(Number));
                                                    }
                                                    setReadOnly(true);
                                                },
                                                type: 'reset',
                                            }}
                                            buttonStyle={{ color: theme.palette.primary.main }}
                                        >
                                            <CancelIcon />
                                        </IconButtonWithPopover>
                                    )}
                                    <IconButtonWithPopover
                                        popoverText={i18next.t('actions.save')}
                                        iconButtonProps={{
                                            onClick: () => setFilters((prevFilters) => prevFilters.filter((filter) => filter in filterRecord)),
                                            type: 'submit',
                                        }}
                                        buttonStyle={{ color: theme.palette.primary.main }}
                                    >
                                        <SaveIcon />
                                    </IconButtonWithPopover>
                                </Grid>
                            )}
                        </Grid>
                    )}

                    {edit && hasEditAndDeletePermission && (
                        <IconButtonWithPopover
                            popoverText={i18next.t('actions.delete')}
                            iconButtonProps={{ onClick: () => setDeleteDialogOpen(true) }}
                            buttonStyle={{ color: theme.palette.primary.main }}
                        >
                            <Delete />
                        </IconButtonWithPopover>
                    )}
                </Grid>
            </TopBarGrid>
            <AreYouSureDialog open={deleteDialogOpen} handleClose={() => setDeleteDialogOpen(false)} onYes={onDelete} />
        </Box>
    );
};

export { ChartTopBar };
