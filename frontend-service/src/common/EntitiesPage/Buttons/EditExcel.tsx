import i18next from 'i18next';
import React, { CSSProperties, useState } from 'react';
import { useTheme } from '@mui/material';
import { EntityWizardValues } from '../../dialogs/entity';
import { TableButton } from '../../TableButton';
import { useDarkModeStore } from '../../../stores/darkMode';
import { EditExcelWizard } from '../../wizards/excel/EditExcelWizard';

const EditExcelButton: React.FC<{
    style?: CSSProperties;
    disabled?: boolean;
    initialValues?: EntityWizardValues;
    popoverText?: string;
    onSuccessCreate: () => void;
}> = ({ style, children, disabled, initialValues, popoverText, onSuccessCreate }) => {
    const [editExcelState, setEditExcelState] = useState<{
        isOpen: boolean;
        initialStep?: number;
    }>({
        isOpen: false,
    });

    const darkMode = useDarkModeStore((state) => state.darkMode);
    const theme = useTheme();

    const disabledColor = darkMode ? 'rgba(255, 255, 255, 0.26)' : 'rgba(0, 0, 0, 0.26)';

    return (
        <>
            <TableButton
                iconButtonWithPopoverProps={{
                    iconButtonProps: {
                        onClick: () => {
                            if (!disabled) setEditExcelState({ isOpen: true, initialStep: 1 });
                        },
                        style: { ...style, color: disabled ? disabledColor : theme.palette.primary.main },
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
                initialValues={{ template: initialValues?.template, files: undefined }}
                initialStep={1}
            />
        </>
    );
};

export { EditExcelButton };
