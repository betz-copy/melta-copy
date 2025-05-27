import i18next from 'i18next';
import React from 'react';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';

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

export { ConfirmEditCommonItem, ConfirmDeleteCommonItem };
