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
    popoverText?: string;
}> = ({ style, children, disabled, initialStep, initialValues, popoverText, disabledToolTip = false }) => {
    const [addEntityWizardState, setAddEntityWizardState] = useState<{ isOpen: boolean; initialStep?: number; initialValues?: EntityWizardValues }>({
        isOpen: false,
    });

    return (
        <>
            <IconButtonWithPopover
                popoverText={popoverText || i18next.t('entitiesTableOfTemplate.addEntity')}
                disabledToolTip={disabledToolTip}
                iconButtonProps={{
                    onClick: () => {
                        setAddEntityWizardState({ isOpen: true, initialStep, initialValues });
                    },
                    style,
                }}
                style={style}
                disabled={disabled}
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
                initalStep={addEntityWizardState.initialStep}
                initialValues={addEntityWizardState.initialValues}
            />
        </>
    );
};

export { AddEntityButton };
