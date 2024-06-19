import React, { useState, CSSProperties } from 'react';
import i18next from 'i18next';
import { Dialog } from '@mui/material';
import { EntityWizardValues } from '../dialogs/entity';
import IconButtonWithPopover from '../IconButtonWithPopover';
import { CreateOrEditEntityDetails } from '../dialogs/entity/CreateOrEditEntityDialog';
import { IEntity } from '../../interfaces/entities';

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
    const [externalErrors, setExternalErrors] = useState({ files: false, unique: {} });

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
                        setExternalErrors({ files: false, unique: {} });
                    },
                    style,
                }}
                style={style}
                disabled={disabled}
            >
                {children}
            </IconButtonWithPopover>

            <Dialog open={addEntityWizardState.isOpen} maxWidth="md">
                <CreateOrEditEntityDetails
                    isEditMode={false}
                    entityTemplate={
                        addEntityWizardState.initialValues?.template || {
                            _id: '',
                            displayName: '',
                            name: '',
                            category: {
                                _id: '',
                                name: '',
                                displayName: '',
                                color: '',
                            },
                            properties: {
                                properties: {},
                                required: [],
                                type: 'object',
                                hide: [],
                            },
                            propertiesOrder: [],
                            propertiesTypeOrder: ['properties', 'attachmentProperties'],
                            propertiesPreview: [],
                            uniqueConstraints: [],
                            disabled: false,
                        }
                    }
                    entity={
                        addEntityWizardState.initialValues
                            ? addEntityWizardState.initialValues
                            : { properties: { disabled: false, _id: '', createdAt: '', updatedAt: '' }, templateId: '' }
                    }
                    onSuccessUpdate={() => {
                        setAddEntityWizardState((prev) => ({ ...prev, isOpen: false }));
                        setExternalErrors({ files: false, unique: {} });
                    }}
                    onCancelUpdate={() => {
                        setAddEntityWizardState((prev) => ({ ...prev, isOpen: false }));
                        setExternalErrors({ files: false, unique: {} });
                    }}
                    onError={(currEntity) => {
                        console.log({ currEntity });

                        setAddEntityWizardState({
                            isOpen: true,
                            initialStep: 1,
                            initialValues: currEntity as EntityWizardValues,
                        });
                    }}
                    externalErrors={externalErrors}
                    setExternalErrors={setExternalErrors}
                    onSuccessCreate={onSuccessCreate}
                />
            </Dialog>
        </>
    );
};

export { AddEntityButton };
