import i18next from 'i18next';
import React from 'react';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { DashboardItemType } from '../../../interfaces/dashboard';

const ConfirmDeleteDashboardItem: React.FC<{
    isDialogOpen: boolean;
    handleClose: () => void;
    onDeleteYes: () => void;
    type: DashboardItemType | null;
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
                chartPageProps?.isChartPage
                    ? chartPageProps.usedInDashboard
                        ? i18next.t(`dashboard.dialogs.delete.body.${type}`)
                        : undefined
                    : i18next.t('dashboard.dialogs.delete.body.dashboard', { type: i18next.t(`dashboard.itemType.${type}`) })
            }
            isLoading={isLoading}
        />
    );
};

const ConfirmEditCommonItem: React.FC<{ isDialogOpen: boolean; type: DashboardItemType | null; handleClose: () => void; onEditYes: () => void }> = ({
    isDialogOpen,
    type,
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
            title={i18next.t('dashboard.dialogs.edit.title', { type: i18next.t(`dashboard.itemType.${type}`) })}
            body={i18next.t(`dashboard.dialogs.edit.body.${type}`)}
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

export { ConfirmEditCommonItem, ConfirmDeleteDashboardItem, ConfirmEditPermissionCommonItem };
