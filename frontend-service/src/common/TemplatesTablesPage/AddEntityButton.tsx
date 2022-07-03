import React, { useState, CSSProperties } from 'react';
import i18next from 'i18next';
import { EntityWizard, EntityWizardValues } from '../wizards/entity';
import IconButtonWithPopoverText from '../IconButtonWithPopover';

const AddEntityButton: React.FC<{ style?: CSSProperties; initialStep?: number; initialValues?: EntityWizardValues; disabledToolTip?: boolean }> = ({
    style,
    children,
    initialStep,
    initialValues,
    disabledToolTip = false,
}) => {
    const [addEntityWizardState, setAddEntityWizardState] = useState<{ isOpen: boolean; initialStep?: number; initialValues?: EntityWizardValues }>({
        isOpen: false,
    });

    return (
        <>
            <IconButtonWithPopoverText
                iconButtonProps={{ onClick: () => setAddEntityWizardState({ isOpen: true, initialStep, initialValues }), style }}
                popoverText={i18next.t('entitiesTableOfTemplate.addEntity')}
                disabledToolTip={disabledToolTip}
            >
                {children}
            </IconButtonWithPopoverText>
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
