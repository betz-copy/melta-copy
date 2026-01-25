import { Dialog, useTheme } from '@mui/material';
import { ActionTypes } from '@packages/action';
import { IEntity, IPropertyValue } from '@packages/entity';
import i18next from 'i18next';
import React, { CSSProperties, ReactNode, useState } from 'react';
import { useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { ICreateOrUpdateWithRuleBreachDialogState } from '../../../interfaces/CreateOrEditEntityDialog';
import { IEntityTemplateMap, ITemplate } from '../../../interfaces/template';
import { useDarkModeStore } from '../../../stores/darkMode';
import { useDraftIdStore } from '../../../stores/drafts';
import { useWorkspaceStore } from '../../../stores/workspace';
import { EntityWizardValues, emptyEntityTemplate } from '../../dialogs/entity';
import { IChooseTemplateMode } from '../../dialogs/entity/ChooseTemplate';
import { CreateOrEditEntityDetails } from '../../dialogs/entity/CreateOrEditEntityDialog';
import { TableButton } from '../../TableButton';

const isTwinWalletsInTransferTemplate = (properties: IEntity['properties'], template: ITemplate, twinTemplates: string[]) => {
    if (!template.walletTransfer) return false;
    const sourceWalletTemplateId = properties[template.walletTransfer?.from].templateId;
    const destWalletTemplateId = properties[template.walletTransfer?.to].templateId;

    return twinTemplates.includes(sourceWalletTemplateId) && twinTemplates.includes(destWalletTemplateId);
};

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
    getInitialProperties?: (newTemplate: ITemplate) => Record<string, IPropertyValue>;
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
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { twinTemplates } = workspace.metadata;

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
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const handleSuccess = async (entity: IEntity) => {
        const entityTemplate = entityTemplates.get(entity.templateId)!;
        const isTwinWallets = isTwinWalletsInTransferTemplate(entity.properties, entityTemplate, twinTemplates);

        onSuccessCreate?.(entity);
        setAddEntityWizardState((prev) => ({ ...prev, isOpen: false }));
        setExternalErrors({ files: false, unique: {}, action: '' });
        setUpdatedTemplateIds?.([
            entity.templateId,
            isTwinWallets && !!entityTemplate.walletTransfer ? entity.properties[entityTemplate.walletTransfer?.to]?.templateId : undefined,
        ]);
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
                slotProps={{
                    paper: {
                        sx: {
                            overflow: 'hidden',
                        },
                    },
                }}
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
