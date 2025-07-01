import i18next from 'i18next';
import React from 'react';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { DashboardItemType } from '../../../interfaces/dashboard';

const ConfirmDeleteDashboardItem: React.FC<{
    isDialogOpen: boolean;
    handleClose: () => void;
    onDeleteYes: () => void;
    type: DashboardItemType | null;
    commonItemProps?: {
        isNotDashboardPage?: boolean;
        usedInDashboard?: boolean;
    };
    isLoading?: boolean;
}> = ({ isDialogOpen, handleClose, onDeleteYes, isLoading, type, commonItemProps }) => {
    let bodyText: string | undefined;

    if (commonItemProps?.isNotDashboardPage)
        if (commonItemProps.usedInDashboard) bodyText = i18next.t(`dashboard.dialogs.delete.body.${type}`);
        else bodyText = undefined;
    else
        bodyText = i18next.t('dashboard.dialogs.delete.body.dashboard', {
            type: i18next.t(`dashboard.itemType.${type}`),
        });

    return (
        <AreYouSureDialog
            open={isDialogOpen}
            handleClose={handleClose}
            onYes={onDeleteYes}
            yesTitle={i18next.t('actions.delete')}
            noTitle={i18next.t('dashboard.back')}
            title={i18next.t('dashboard.dialogs.delete.title', { type: i18next.t(`dashboard.itemType.${type}`) })}
            body={bodyText}
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

const ChangeTemplate: React.FC<{
    isDialogOpen: boolean;
    handleClose: () => void;
    onYes: () => void;
    type: DashboardItemType;
}> = ({ isDialogOpen, handleClose, onYes, type }) => {
    return (
        <AreYouSureDialog
            open={isDialogOpen}
            handleClose={handleClose}
            onYes={onYes}
            title={i18next.t('dashboard.dialogs.changeTemplate.title')}
            noTitle={i18next.t('dashboard.dialogs.changeTemplate.noTitle')}
            yesTitle={i18next.t('dashboard.dialogs.changeTemplate.yesTitle')}
            body={i18next.t('dashboard.dialogs.changeTemplate.body', { type: i18next.t(`dashboard.itemType.${type}`) })}
        />
    );
};

export { ConfirmEditCommonItem, ConfirmDeleteDashboardItem, ConfirmEditPermissionCommonItem, ChangeTemplate };
