import { Dialog, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { CSSProperties, ReactNode, useState } from 'react';
import { toast } from 'react-toastify';
import { IMongoChildTemplatePopulated } from '../../../interfaces/childTemplates';
import { ICreateOrUpdateWithRuleBreachDialogState } from '../../../interfaces/CreateOrEditEntityDialog';
import { IEntity } from '../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { ActionTypes } from '../../../interfaces/ruleBreaches/actionMetadata';
import { useDarkModeStore } from '../../../stores/darkMode';
import { useDraftIdStore } from '../../../stores/drafts';
import { emptyEntityTemplate, EntityWizardValues } from '../../dialogs/entity';
import { IChooseTemplateMode } from '../../dialogs/entity/ChooseTemplate';
import { CreateOrEditEntityDetails } from '../../dialogs/entity/CreateOrEditEntityDialog';
import { TableButton } from '../../TableButton';

const AddEntityButton: React.FC<{
    style?: CSSProperties;
    disabled?: boolean;
    initialStep?: number;
    initialValues?: EntityWizardValues;
    disabledToolTip?: boolean;
    popoverText?: string;
    onSuccessCreate?: (entity: IEntity) => void;
    setUpdatedEntities?: React.Dispatch<React.SetStateAction<IEntity[]>>;
    setUpdatedTemplateIds?: React.Dispatch<React.SetStateAction<string[]>>;
    chooseMode?: IChooseTemplateMode;
    parentId?: string;
    getInitialProperties?: (newTemplate: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated) => Record<string, any>;
    children?: ReactNode;
}> = ({
    style,
    children,
    disabled,
    initialStep,
    initialValues,
    popoverText,
    disabledToolTip = false,
    onSuccessCreate,
    setUpdatedTemplateIds,
    setUpdatedEntities,
    chooseMode = IChooseTemplateMode.TemplatesAndChildren,
    parentId,
    getInitialProperties,
}) => {
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

    const template = addEntityWizardState.initialValues?.template;

    const handleSuccess = (entity: IEntity) => {
        onSuccessCreate?.(entity);
        setAddEntityWizardState((prev) => ({ ...prev, isOpen: false }));
        setExternalErrors({ files: false, unique: {}, action: '' });
        setUpdatedTemplateIds?.([entity.templateId]);
        setUpdatedEntities?.(
            Object.values(entity.properties).filter(
                (property): property is IEntity => typeof property === 'object' && 'templateId' in property && 'properties' in property,
            ),
        );
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
                maxWidth={
                    template?.documentTemplatesIds?.length
                        ? 'lg'
                        : Object.keys(template || emptyEntityTemplate.properties.properties).length === 1
                          ? 'sm'
                          : 'md'
                }
                fullWidth
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
                    entityTemplate={template || emptyEntityTemplate}
                    initialCurrValues={addEntityWizardState.initialCurrValues ?? addEntityWizardState.initialValues}
                    handleClose={() => setAddEntityWizardState((prev) => ({ ...prev, isOpen: false }))}
                    externalErrors={externalErrors}
                    setExternalErrors={setExternalErrors}
                    createOrUpdateWithRuleBreachDialogState={createOrUpdateWithRuleBreachDialogState}
                    setCreateOrUpdateWithRuleBreachDialogState={setCreateOrUpdateWithRuleBreachDialogState}
                    chooseMode={chooseMode}
                    parentId={parentId}
                    getInitialProperties={getInitialProperties}
                />
            </Dialog>
        </>
    );
};

export { AddEntityButton };
