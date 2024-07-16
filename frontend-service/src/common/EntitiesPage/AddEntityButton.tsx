import React, { useState, CSSProperties } from 'react';
import i18next from 'i18next';
import { Dialog } from '@mui/material';
import { EntityWizardValues } from '../dialogs/entity';
import IconButtonWithPopover from '../IconButtonWithPopover';
import { CreateOrEditEntityDetails, ICreateOrUpdateWithRuleBreachDialogState } from '../dialogs/entity/CreateOrEditEntityDialog';
import { IEntity } from '../../interfaces/entities';
import { toast } from 'react-toastify';

const AddEntityButton: React.FC<{
    style?: CSSProperties;
    disabled?: boolean;
    initialStep?: number;
    initialValues?: EntityWizardValues;
    disabledToolTip?: boolean;
    popoverText?: string;
    onSuccessCreate?: (entity: IEntity) => void;
}> = ({ style, children, disabled, initialStep, initialValues, popoverText, disabledToolTip = false, onSuccessCreate }) => {
    const [addEntityWizardState, setAddEntityWizardState] = useState<{
        isOpen: boolean;
        initialStep?: number;
        initialValues?: EntityWizardValues;
        initalCurrValues?: EntityWizardValues;
    }>({
        isOpen: false,
    });
    const [createOrUpdateWithRuleBreachDialogState, setCreateOrUpdateWithRuleBreachDialogState] = useState<ICreateOrUpdateWithRuleBreachDialogState>({
        isOpen: false,
    });
    const [externalErrors, setExternalErrors] = useState({ files: false, unique: {} });
    const [gotClosed, setGotClosed] = useState(false);

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
                        setCreateOrUpdateWithRuleBreachDialogState({ isOpen: false });
                        toast.dismiss();
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
                    initialCurrValues={addEntityWizardState.initalCurrValues}
                    onSuccessUpdate={() => {
                        setAddEntityWizardState((prev) => ({ ...prev, isOpen: false }));
                        setExternalErrors({ files: false, unique: {} });
                        setGotClosed(false);
                    }}
                    handleClose={(isSubmit?: boolean) => {
                        setAddEntityWizardState((prev) => ({ ...prev, isOpen: false }));
                        setGotClosed(isSubmit || false);
                    }}
                    onError={(currEntityValues) =>
                        setAddEntityWizardState((prev) => ({
                            ...prev,
                            isOpen: true,
                            initialStep: 1,
                            initalCurrValues: currEntityValues,
                        }))
                    }
                    externalErrors={externalErrors}
                    setExternalErrors={setExternalErrors}
                    onSuccessCreate={onSuccessCreate}
                    createOrUpdateWithRuleBreachDialogState={createOrUpdateWithRuleBreachDialogState}
                    setCreateOrUpdateWithRuleBreachDialogState={setCreateOrUpdateWithRuleBreachDialogState}
                    gotClosed={gotClosed}
                />
            </Dialog>
        </>
    );
};

export { AddEntityButton };
