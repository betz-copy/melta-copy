import React, { useState, CSSProperties } from 'react';
import i18next from 'i18next';
import { Dialog } from '@mui/material';
import { emptyEntityTemplate, EntityWizardValues } from '../dialogs/entity';
import IconButtonWithPopover from '../IconButtonWithPopover';
import { CreateOrEditEntityDetails } from '../dialogs/entity/CreateOrEditEntityDialog';
import { IEntity } from '../../interfaces/entities';
import { useDraftIdStore } from '../../stores/drafts';

const AddEntityButton: React.FC<{
    style?: CSSProperties;
    disabled?: boolean;
    initialStep?: number;
    initialValues?: EntityWizardValues;
    disabledToolTip?: boolean;
    popoverText?: string;
    onSuccessCreate?: (entity: IEntity) => void;
}> = ({ style, children, disabled, initialStep, initialValues, popoverText, disabledToolTip = false, onSuccessCreate }) => {
    const [addEntityWizardState, setAddEntityWizardState] = useState<{ isOpen: boolean; initialStep?: number; initialValues?: EntityWizardValues }>({
        isOpen: false,
    });

    const setDraftId = useDraftIdStore((state) => state.setDraftId);

    return (
        <>
            <IconButtonWithPopover
                popoverText={
                    popoverText ?? (disabled ? i18next.t('permissions.dontHaveWritePermissions') : i18next.t('entitiesTableOfTemplate.addEntity'))
                }
                disabledToolTip={disabledToolTip}
                iconButtonProps={{
                    onClick: () => {
                        setAddEntityWizardState({ isOpen: true, initialStep, initialValues });
                        setDraftId('');
                    },
                    style,
                }}
                style={style}
                disabled={disabled}
            >
                {children}
            </IconButtonWithPopover>
            <Dialog open={addEntityWizardState.isOpen} maxWidth={addEntityWizardState.initialValues?.template.pdfTemplatesIds?.length ? 'lg' : 'md'}>
                <CreateOrEditEntityDetails
                    isEditMode={false}
                    entityTemplate={addEntityWizardState.initialValues?.template || emptyEntityTemplate}
                    onSuccessUpdate={() => {}}
                    handleClose={() => setAddEntityWizardState({ isOpen: false })}
                    onSuccessCreate={onSuccessCreate}
                />
            </Dialog>
        </>
    );
};

export { AddEntityButton };
