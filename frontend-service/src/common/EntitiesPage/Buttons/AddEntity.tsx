import { Dialog, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { CSSProperties, useState } from 'react';
import { toast } from 'react-toastify';
import { emptyEntityTemplate, EntityWizardValues } from '../../dialogs/entity';
import { CreateOrEditEntityDetails } from '../../dialogs/entity/CreateOrEditEntityDialog';
import { ICreateOrUpdateWithRuleBreachDialogState } from '../../../interfaces/CreateOrEditEntityDialog';
import { IEntity } from '../../../interfaces/entities';
import { useDraftIdStore } from '../../../stores/drafts';
import { TableButton } from '../../TableButton';
import { useDarkModeStore } from '../../../stores/darkMode';
import { ActionTypes } from '../../../interfaces/ruleBreaches/actionMetadata';

const AddEntityButton: React.FC<{
    style?: CSSProperties;
    disabled?: boolean;
    initialStep?: number;
    initialValues: EntityWizardValues;
    disabledToolTip?: boolean;
    popoverText?: string;
    onSuccessCreate?: (entity: IEntity) => void;
    setUpdatedEntities?: React.Dispatch<React.SetStateAction<IEntity[]>>;
}> = ({ style, children, disabled, initialStep, initialValues, popoverText, disabledToolTip = false, onSuccessCreate, setUpdatedEntities }) => {
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
    const [externalErrors, setExternalErrors] = useState({ files: false, unique: {}, action: '' });

    const setDraftId = useDraftIdStore((state) => state.setDraftId);

    const darkMode = useDarkModeStore((state) => state.darkMode);
    const theme = useTheme();
    const disabledColor = darkMode ? 'rgba(255, 255, 255, 0.26)' : 'rgba(0, 0, 0, 0.26)';

    const handleSuccess = (entity: IEntity) => {
        onSuccessCreate?.(entity);
        setUpdatedEntities?.(
            Object.values(entity.properties).filter(
                (property): property is IEntity => typeof property === 'object' && 'templateId' in property && 'properties' in property,
            ),
        );

        setAddEntityWizardState((prev) => ({ ...prev, isOpen: false }));
        setExternalErrors({ files: false, unique: {}, action: '' });
    };

    return (
        <>
            <TableButton
                iconButtonWithPopoverProps={{
                    iconButtonProps: {
                        onClick: () => {
                            if (disabled) return;
                            setAddEntityWizardState({ isOpen: true, initialStep, initialValues });
                            setExternalErrors({ files: false, unique: {}, action: '' });
                            setCreateOrUpdateWithRuleBreachDialogState({ isOpen: false });
                            toast.dismiss();
                            setDraftId('');
                        },
                        style: { ...style, color: disabled ? disabledColor : theme.palette.primary.main },
                    },
                    popoverText:
                        popoverText ??
                        (disabled ? i18next.t('permissions.dontHaveWritePermissionsToTemplate') : i18next.t('entitiesTableOfTemplate.addEntity')),
                    disabledToolTip,
                }}
                disableButton={disabled}
            >
                {children}
            </TableButton>

            <Dialog
                open={addEntityWizardState.isOpen}
                maxWidth={addEntityWizardState.initialValues?.template.documentTemplatesIds?.length ? 'lg' : 'md'}
            >
                <CreateOrEditEntityDetails
                    mutationProps={{
                        actionType: ActionTypes.CreateEntity,
                        payload: undefined,
                        onError: (currEntityValues) =>
                            setAddEntityWizardState((prev) => ({
                                ...prev,
                                isOpen: true,
                                initialStep: 1,
                                initialCurrValues: currEntityValues,
                            })),

                        onSuccess: handleSuccess,
                    }}
                    entityTemplate={addEntityWizardState.initialValues?.template || emptyEntityTemplate}
                    initialCurrValues={addEntityWizardState.initialCurrValues ?? addEntityWizardState.initialValues}
                    handleClose={() => {
                        setAddEntityWizardState((prev) => ({ ...prev, isOpen: false }));
                    }}
                    externalErrors={externalErrors}
                    setExternalErrors={setExternalErrors}
                    createOrUpdateWithRuleBreachDialogState={createOrUpdateWithRuleBreachDialogState}
                    setCreateOrUpdateWithRuleBreachDialogState={setCreateOrUpdateWithRuleBreachDialogState}
                />
            </Dialog>
        </>
    );
};

export { AddEntityButton };
