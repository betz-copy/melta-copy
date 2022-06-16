import React, { useState, CSSProperties } from 'react';
import { IconButton } from '@mui/material';
import { EntityWizard, EntityWizardValues } from '../wizards/entity';

const AddEntityButton: React.FC<{ style?: CSSProperties; initialStep?: number; initialValues?: EntityWizardValues }> = ({
    style,
    children,
    initialStep,
    initialValues,
}) => {
    const [addEntityWizardState, setAddEntityWizardState] = useState<{ isOpen: boolean; initialStep?: number; initialValues?: EntityWizardValues }>({
        isOpen: false,
    });

    return (
        <>
            <IconButton onClick={() => setAddEntityWizardState({ isOpen: true, initialStep, initialValues })} style={style}>
                {children}
            </IconButton>
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
