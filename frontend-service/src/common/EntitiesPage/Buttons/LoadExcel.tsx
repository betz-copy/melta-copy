import i18next from 'i18next';
import React, { useState } from 'react';
import { EntityWizardValues } from '../../dialogs/entity';
import { TableButton } from '../../TableButton';
import { LoadEntitiesWizard } from '../../wizards/excel/LoadEntitiesWizard';

const LoadExcelButton: React.FC<{
    disabled?: boolean;
    initialValues?: EntityWizardValues;
    popoverText?: string;
    onSuccessCreate: () => void;
    childTemplateId?: string;
}> = ({ children, disabled, initialValues, popoverText, onSuccessCreate, childTemplateId }) => {
    const [loadEntitiesState, setLoadEntitiesState] = useState<{
        isOpen: boolean;
        initialStep?: number;
    }>({
        isOpen: false,
    });

    return (
        <>
            <TableButton
                iconButtonWithPopoverProps={{
                    iconButtonProps: {
                        onClick: () => {
                            if (!disabled) setLoadEntitiesState({ isOpen: true, initialStep: 1 });
                        },
                    },
                    popoverText:
                        popoverText ??
                        (disabled ? i18next.t('permissions.dontHaveWritePermissions') : i18next.t('entitiesTableOfTemplate.loadEntitiesTitle')),
                }}
                disableButton={disabled}
            >
                {children}
            </TableButton>

            <LoadEntitiesWizard
                open={loadEntitiesState.isOpen}
                handleClose={() => {
                    onSuccessCreate();
                    setLoadEntitiesState({ isOpen: false });
                }}
                initialValues={{ template: initialValues?.template }}
                initialStep={1}
                childTemplateId={childTemplateId}
            />
        </>
    );
};

export { LoadExcelButton };
