import i18next from 'i18next';
import React from 'react';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { DashboardItemType } from '../../../interfaces/dashboard';

const ConfirmDeleteDashboardItem: React.FC<{
    isDialogOpen: boolean;
    handleClose: () => void;
    onDeleteYes: () => void;
    type: DashboardItemType;
    chartPageProps?: {
        isChartPage: boolean;
        usedInDashboard?: boolean;
    };
    isLoading?: boolean;
}> = ({ isDialogOpen, handleClose, onDeleteYes, isLoading, type, chartPageProps }) => {
    return (
        <AreYouSureDialog
            open={isDialogOpen}
            handleClose={handleClose}
            onYes={onDeleteYes}
            yesTitle={i18next.t('actions.delete')}
            noTitle={i18next.t('dashboard.back')}
            title={i18next.t('dashboard.dialogs.delete.title', { type: i18next.t(`dashboard.itemType.${type}`) })}
            body={
                // eslint-disable-next-line no-nested-ternary
                chartPageProps?.isChartPage
                    ? chartPageProps.usedInDashboard
                        ? i18next.t('dashboard.charts.onDeleteDialog.body')
                        : undefined
                    : i18next.t('dashboard.dialogs.delete.body', { type: i18next.t(`dashboard.itemType.${type}`) })
            }
            isLoading={isLoading}
        />
    );
};

const ConfirmDeleteCommonItem: React.FC<{
    isDialogOpen: boolean;
    handleClose: () => void;
    onDeleteYes: () => void;
    usedInDashboard?: boolean;
    isLoading?: boolean;
}> = ({ isDialogOpen, handleClose, onDeleteYes, isLoading, usedInDashboard }) => {
    return (
        <AreYouSureDialog
            open={isDialogOpen}
            handleClose={handleClose}
            onYes={onDeleteYes}
            yesTitle={i18next.t('actions.delete')}
            noTitle={i18next.t('dashboard.back')}
            title={usedInDashboard ? i18next.t('dashboard.charts.onDeleteDialog.title') : undefined}
            body={usedInDashboard ? i18next.t('dashboard.charts.onDeleteDialog.body') : undefined}
            isLoading={isLoading}
        />
    );
};

const ConfirmEditCommonItem: React.FC<{ isDialogOpen: boolean; handleClose: () => void; onEditYes: () => void }> = ({
    isDialogOpen,
    handleClose,
    onEditYes,
}) => {
    return (
        <AreYouSureDialog
            open={isDialogOpen}
            handleClose={handleClose}
            onYes={onEditYes}
            yesTitle={i18next.t('dashboard.continueEdit')}
            noTitle={i18next.t('dashboard.back')}
            title={i18next.t('dashboard.charts.onEditDialog.title')}
            body={i18next.t('dashboard.charts.onEditDialog.body')}
        />
    );
};

const ConfirmEditPermissionCommonItem: React.FC<{ isDialogOpen: boolean; handleClose: () => void; onEditYes: () => void }> = ({
    isDialogOpen,
    handleClose,
    onEditYes,
}) => {
    return (
        <AreYouSureDialog
            open={isDialogOpen}
            handleClose={handleClose}
            onYes={onEditYes}
            yesTitle={i18next.t('dashboard.charts.changePermissionDialog.gotIt')}
            noTitle={i18next.t('dashboard.back')}
            title={i18next.t('dashboard.charts.changePermissionDialog.title')}
            body={i18next.t('dashboard.charts.changePermissionDialog.body')}
        />
    );
};

export { ConfirmEditCommonItem, ConfirmDeleteCommonItem, ConfirmDeleteDashboardItem, ConfirmEditPermissionCommonItem };
