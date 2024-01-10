import React, { useState, CSSProperties } from 'react';
import i18next from 'i18next';
import { EntityWizard, EntityWizardValues } from '../wizards/entity';
import IconButtonWithPopover from '../IconButtonWithPopover';

const AddEntityButton: React.FC<{
    style?: CSSProperties;
    disabled?: boolean;
    initialStep?: number;
    initialValues?: EntityWizardValues;
    disabledToolTip?: boolean;
}> = ({ style, children, disabled, initialStep, initialValues, disabledToolTip = false }) => {
    const [addEntityWizardState, setAddEntityWizardState] = useState<{ isOpen: boolean; initialStep?: number; initialValues?: EntityWizardValues }>({
        isOpen: false,
    });

    return (
        <>
            <IconButtonWithPopover
                popoverText={disabled ? i18next.t('categoryPage.disabledTemplate') : i18next.t('entitiesTableOfTemplate.addEntity')}
                disabledToolTip={disabledToolTip}
                iconButtonProps={{
                    onClick: () => {
                        if (!disabled) setAddEntityWizardState({ isOpen: true, initialStep, initialValues });
                    },
                    style,
                    disableRipple: disabled,
                }}
                style={style}
            >
                {children}
            </IconButtonWithPopover>
            <EntityWizard
                open={addEntityWizardState.isOpen}
                handleClose={() =>
                    setAddEntityWizardState({
                        isOpen: false,
                    })
                }
                initalStep={0}
                initialValues={addEntityWizardState.initialValues}
            />
        </>
    );
};

export { AddEntityButton };
