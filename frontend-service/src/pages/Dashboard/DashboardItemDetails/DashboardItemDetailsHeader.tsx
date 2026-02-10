import { Check, Close, Edit } from '@mui/icons-material';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import { IMongoChart } from '@packages/chart';
import { DashboardItemType } from '@packages/dashboard';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import { isEqual } from 'lodash';
import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import { DashboardItemForm, ViewMode } from '../../../interfaces/dashboard';
import { useDarkModeStore } from '../../../stores/darkMode';
import { useUserStore } from '../../../stores/user';
import { isWorkspaceAdmin } from '../../../utils/permissions/instancePermissions';
import { CardMenu } from '../../SystemManagement/components/CardMenu';
import { ConfirmDeleteDashboardItem } from '../Dialogs';

enum CancelType {
    Reset = 'reset',
    Back = 'back',
}

interface DashboardItemDetailsHeaderProps<T extends DashboardItemForm> {
    title: string;
    backPath: { title: string; path: string };
    onDelete: () => void;
    isLoading: boolean;
    viewMode: {
        value: ViewMode;
        set: React.Dispatch<React.SetStateAction<ViewMode>>;
    };
    type: DashboardItemType;
    chartPageProps?: {
        isChartPage: boolean;
        usedInDashboard?: boolean;
    };
    formikProps: FormikProps<T>;
    isValidForm?: boolean;
}

const DashboardItemDetailsHeader = <T extends DashboardItemForm>({
    title,
    backPath,
    onDelete,
    type,
    chartPageProps,
    isLoading,
    viewMode,
    isValidForm,
    formikProps: { values, initialValues, resetForm },
}: DashboardItemDetailsHeaderProps<T>): React.ReactElement => {
    const theme = useTheme();
    const [, navigate] = useLocation();

    const darkMode = useDarkModeStore((state) => state.darkMode);
    const currentUser = useUserStore((state) => state.user);

    const hasAdminPermission = isWorkspaceAdmin(currentUser.currentWorkspacePermissions);
    const hasPermissionChartPage =
        chartPageProps?.isChartPage && type === DashboardItemType.Chart && (values as IMongoChart).createdBy === currentUser._id;
    const hasPermission = hasAdminPermission || hasPermissionChartPage;

    const isSameObject = isEqual(values, initialValues);
    const isDisabledForm = !isValidForm || isSameObject;

    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const [confirmCancelChanges, setConfirmCancelChanges] = useState<{
        isDialogOpen: boolean;
        cancelType: CancelType | null;
    }>({
        isDialogOpen: false,
        cancelType: null,
    });

    const confirmCancelChangesHandler = () => {
        if (viewMode.value === ViewMode.Add || confirmCancelChanges.cancelType === CancelType.Back) {
            navigate(backPath.path);
        } else {
            viewMode.set(ViewMode.ReadOnly);
            resetForm();
        }

        setConfirmCancelChanges({ isDialogOpen: false, cancelType: null });
    };

    const handleBackNavigationClick = () => {
        if (viewMode.value !== ViewMode.ReadOnly && !isSameObject) {
            setConfirmCancelChanges({ isDialogOpen: true, cancelType: CancelType.Back });
        } else {
            navigate(backPath.path);
        }
    };

    const handleResetClick = () => {
        if (viewMode.value === ViewMode.Edit && isSameObject) {
            confirmCancelChangesHandler();
            return;
        }

        setConfirmCancelChanges({ isDialogOpen: true, cancelType: CancelType.Reset });
    };

    return (
        <Box
            bgcolor={darkMode ? '#131313' : '#fcfeff'}
            height="3.6rem"
            paddingRight="2.5rem"
            paddingTop="0.5rem"
            paddingLeft="2rem"
            paddingBottom="0.4rem"
            boxShadow="-2px 2px 6px 0px #1E277533"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            position="sticky"
            style={{ top: 0, right: 0, zIndex: 1 }}
        >
            <Box display="flex" alignItems="center" gap="15px">
                <Grid>
                    <Typography
                        color={theme.palette.primary.main}
                        fontWeight={400}
                        component="h4"
                        variant="h4"
                        fontSize={14}
                        onClick={handleBackNavigationClick}
                        sx={{ cursor: 'pointer', textDecoration: 'none' }}
                    >
                        {backPath.title}
                    </Typography>
                </Grid>
                <Grid>
                    <Typography color={theme.palette.primary.main} fontWeight="400" component="h4" variant="h4" fontSize="14px">
                        {'>'}
                    </Typography>
                </Grid>
                <Grid>
                    <Typography color={theme.palette.primary.main} fontWeight="600" component="h4" variant="h4" fontSize="24px">
                        {title}
                    </Typography>
                </Grid>
            </Box>
            <Box display="flex" alignItems="center" gap="10px">
                {viewMode.value === ViewMode.ReadOnly && hasPermission && (
                    <IconButtonWithPopover
                        popoverText={i18next.t('actions.edit')}
                        iconButtonProps={{
                            onClick: () => viewMode.set(ViewMode.Edit),
                        }}
                        style={{ background: theme.palette.primary.main, borderRadius: '7px', width: '100px', height: '35px' }}
                    >
                        <Edit htmlColor="white" />
                        <Typography fontSize={13} style={{ fontWeight: '400', padding: '0 5px', color: 'white' }}>
                            {i18next.t('actions.edit')}
                        </Typography>
                    </IconButtonWithPopover>
                )}

                {((viewMode.value !== ViewMode.ReadOnly && hasPermission) || (viewMode.value === ViewMode.Add && chartPageProps?.isChartPage)) && (
                    <>
                        <IconButtonWithPopover
                            popoverText={i18next.t('actions.cancel')}
                            iconButtonProps={{
                                onClick: () => handleResetClick(),
                            }}
                            style={{
                                background: '#fcfeff',
                                borderRadius: '7px',
                                border: `1px solid ${theme.palette.primary.main}`,
                                width: '100px',
                                height: '35px',
                            }}
                        >
                            <Close htmlColor={theme.palette.primary.main} />
                            <Typography fontSize={13} style={{ fontWeight: '400', padding: '0 5px', color: theme.palette.primary.main }}>
                                {i18next.t('actions.cancel')}
                            </Typography>
                        </IconButtonWithPopover>
                        <IconButtonWithPopover
                            popoverText={i18next.t('actions.save')}
                            iconButtonProps={{
                                type: 'submit',
                            }}
                            style={{
                                background: isDisabledForm ? '#F3F5F9' : theme.palette.primary.main,
                                borderRadius: '7px',
                                width: '100px',
                                height: '35px',
                            }}
                            disabled={isDisabledForm}
                        >
                            <Check htmlColor={isDisabledForm ? '#9B9DB6' : 'white'} />
                            <Typography fontSize={13} style={{ fontWeight: '400', padding: '0 5px', color: isDisabledForm ? '#9B9DB6' : 'white' }}>
                                {i18next.t('actions.save')}
                            </Typography>
                        </IconButtonWithPopover>
                    </>
                )}

                {viewMode.value !== ViewMode.Add && hasPermission && (
                    <Box style={{ color: theme.palette.primary.main }} onMouseDown={(e) => e.stopPropagation()}>
                        <CardMenu onDeleteClick={() => setDeleteDialogOpen(true)} optionsIconStyle={{ color: theme.palette.primary.main }} />
                    </Box>
                )}
            </Box>

            <ConfirmDeleteDashboardItem
                isDialogOpen={deleteDialogOpen}
                handleClose={() => setDeleteDialogOpen(false)}
                onDeleteYes={onDelete}
                type={type}
                isLoading={isLoading}
                commonItemProps={{ ...chartPageProps, isNotDashboardPage: chartPageProps?.isChartPage }}
            />

            <AreYouSureDialog
                open={confirmCancelChanges.isDialogOpen}
                handleClose={() => setConfirmCancelChanges({ isDialogOpen: false, cancelType: null })}
                onYes={confirmCancelChangesHandler}
                title={i18next.t('dashboard.dialogs.cancel.title')}
                body={i18next.t(`dashboard.dialogs.cancel.${viewMode.value === ViewMode.Add ? 'add' : 'edit'}Mode`, {
                    type: i18next.t(`dashboard.itemType.${type}`),
                })}
                yesTitle={i18next.t('dashboard.dialogs.cancel.yesTitle')}
                noTitle={i18next.t('dashboard.dialogs.cancel.noTitle')}
            />
        </Box>
    );
};

export default DashboardItemDetailsHeader;
