import { Dialog } from '@mui/material';
import i18next from 'i18next';
import React, { CSSProperties, useState } from 'react';
import { toast } from 'react-toastify';
import { IEntity } from '../../interfaces/entities';
import { useDraftIdStore } from '../../stores/drafts';
import { emptyEntityTemplate, EntityWizardValues } from '../dialogs/entity';
import { CreateOrEditEntityDetails, ICreateOrUpdateWithRuleBreachDialogState } from '../dialogs/entity/CreateOrEditEntityDialog';
import { TableButton } from '../TableButton';

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
        initialCurrValues?: EntityWizardValues;
    }>({
        isOpen: false,
    });
    const [createOrUpdateWithRuleBreachDialogState, setCreateOrUpdateWithRuleBreachDialogState] = useState<ICreateOrUpdateWithRuleBreachDialogState>({
        isOpen: false,
    });
    const [externalErrors, setExternalErrors] = useState({ files: false, unique: {} });

    const setDraftId = useDraftIdStore((state) => state.setDraftId);

    return (
        <>
            <TableButton
                iconButtonWithPopoverProps={{
                    iconButtonProps: {
                        onClick: () => {
                            setAddEntityWizardState({ isOpen: true, initialStep, initialValues });
                            setExternalErrors({ files: false, unique: {} });
                            setCreateOrUpdateWithRuleBreachDialogState({ isOpen: false });
                            toast.dismiss();
                            setDraftId('');
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

            <Dialog
                open={addEntityWizardState.isOpen}
                maxWidth={addEntityWizardState.initialValues?.template.documentTemplatesIds?.length ? 'lg' : 'md'}
            >
                <CreateOrEditEntityDetails
                    isEditMode={false}
                    entityTemplate={addEntityWizardState.initialValues?.template || emptyEntityTemplate}
                    initialCurrValues={addEntityWizardState.initialCurrValues}
                    onSuccessUpdate={() => {
                        setAddEntityWizardState((prev) => ({ ...prev, isOpen: false }));
                        setExternalErrors({ files: false, unique: {} });
                    }}
                    handleClose={() => {
                        setAddEntityWizardState((prev) => ({ ...prev, isOpen: false }));
                    }}
                    onError={(currEntityValues) =>
                        setAddEntityWizardState((prev) => ({
                            ...prev,
                            isOpen: true,
                            initialStep: 1,
                            initialCurrValues: currEntityValues,
                        }))
                    }
                    externalErrors={externalErrors}
                    setExternalErrors={setExternalErrors}
                    onSuccessCreate={onSuccessCreate}
                    createOrUpdateWithRuleBreachDialogState={createOrUpdateWithRuleBreachDialogState}
                    setCreateOrUpdateWithRuleBreachDialogState={setCreateOrUpdateWithRuleBreachDialogState}
                />
            </Dialog>
        </>
    );
};

export { AddEntityButton };
