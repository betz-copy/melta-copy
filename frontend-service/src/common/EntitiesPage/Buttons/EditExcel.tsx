import i18next from 'i18next';
import React, { ReactNode, useState } from 'react';
import { EntityWizardValues } from '../../dialogs/entity';
import { TableButton } from '../../TableButton';
import { EditExcelWizard } from '../../wizards/excel/EditExcelWizard';

const EditExcelButton: React.FC<{
    disabled?: boolean;
    initialValues?: EntityWizardValues;
    popoverText?: string;
    onSuccessCreate: () => void;
    children?: ReactNode;
}> = ({ children, disabled, initialValues, popoverText, onSuccessCreate }) => {
    const [editExcelState, setEditExcelState] = useState<{
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
                            if (!disabled) setEditExcelState({ isOpen: true, initialStep: 1 });
                        },
                    },
                    popoverText:
                        popoverText ??
                        (disabled ? i18next.t('permissions.dontHaveWritePermissions') : i18next.t('entitiesTableOfTemplate.editExcelTitle')),
                }}
                disableButton={disabled}
            >
                {children}
            </TableButton>

            <EditExcelWizard
                open={editExcelState.isOpen}
                handleClose={() => {
                    onSuccessCreate();
                    setEditExcelState({ isOpen: false });
                }}
                initialValues={{ template: initialValues?.template }}
                initialStep={1}
            />
        </>
    );
};

export { EditExcelButton };
