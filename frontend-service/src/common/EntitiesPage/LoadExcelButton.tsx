import i18next from 'i18next';
import React, { CSSProperties, useState } from 'react';
import { EntityWizardValues } from '../dialogs/entity';
import { TableButton } from '../TableButton';
import { LoadEntitiesWizard } from '../wizards/loadEntities';

const LoadExcelButton: React.FC<{
    style?: CSSProperties;
    disabled?: boolean;
    initialValues?: EntityWizardValues;
    disabledToolTip?: boolean;
    popoverText?: string;
    onSuccessCreate: () => void;
}> = ({ style, children, disabled, initialValues, popoverText, disabledToolTip = false, onSuccessCreate }) => {
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
                        style,
                    },
                    popoverText:
                        popoverText ??
                        (disabled ? i18next.t('permissions.dontHaveWritePermissions') : i18next.t('entitiesTableOfTemplate.addEntity')),
                    disabledToolTip,
                }}
            >
                {children}
            </TableButton>

            <LoadEntitiesWizard
                open={loadEntitiesState.isOpen}
                handleClose={() => {
                    onSuccessCreate();
                    setLoadEntitiesState({ isOpen: false });
                }}
                initialValues={{ template: initialValues?.template, files: undefined }}
                initialStep={1}
            />
        </>
    );
};

export { LoadExcelButton };
