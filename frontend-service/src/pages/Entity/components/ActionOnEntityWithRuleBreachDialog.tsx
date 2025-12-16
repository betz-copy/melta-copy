import {
    ActionOnFail,
    ActionTypes,
    IAction,
    IActionPopulated,
    ICreateEntityMetadata,
    ICreateEntityMetadataPopulated,
    IDuplicateEntityMetadata,
    IDuplicateEntityMetadataPopulated,
    IEntity,
    IRuleBreach,
    IRuleBreachPopulated,
    IRuleBreachRequestPopulated,
    IRuleMap,
    IUpdateEntityMetadata,
    IUpdateEntityMetadataPopulated,
    IUpdateMultipleEntitiesMetadata,
    IUpdateMultipleEntitiesMetadataPopulated,
} from '@microservices/shared';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import mapValues from 'lodash.mapvalues';
import pickBy from 'lodash.pickby';
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { EntityWizardValues } from '../../../common/dialogs/entity';
import ExecWithRuleBreachDialog from '../../../common/dialogs/execWithRuleBreachDialog';
import { ErrorToast } from '../../../common/ErrorToast';
import { environment } from '../../../globals';
import { IErrorResponse } from '../../../interfaces/error';
import { IBrokenRuleEntity } from '../../../interfaces/excel';
import { createRuleBreachRequestRequest } from '../../../services/ruleBreachesService';
import { groupActionsByEntityId, groupBrokenRulesByEntity } from '../../../utils/loadEntities';

const { errorCodes } = environment;

interface UploadedFile {
    name: string;
}

const getUpdateEntityActionMetadata = (currEntity: IEntity, updateEntityFormData: EntityWizardValues): IUpdateEntityMetadataPopulated => {
    const templatePropertiesUpdated = pickBy(updateEntityFormData.template.properties.properties, ({ format, items }, propertyKey) => {
        if (format === 'fileId' || (items && items.format === 'fileId')) {
            const attachmentProperty = updateEntityFormData.attachmentsProperties[propertyKey];
            if (attachmentProperty instanceof File) return true; // for single file the options as new File or undefined
            if (Array.isArray(attachmentProperty)) {
                // if its array
                const attachmentFileName = attachmentProperty?.map((file) => file.name);
                if (!currEntity.properties[propertyKey]) return true;
                if (attachmentFileName.length !== currEntity.properties[propertyKey].length) return true;
                return !attachmentFileName.every((file, index) => file === currEntity.properties[propertyKey][index]);
            }
            if (attachmentProperty === undefined) {
                return false;
            }
            return currEntity.properties[propertyKey] !== (attachmentProperty as UploadedFile)?.name; // for single file the options as new File or undefined
        }
        return currEntity.properties[propertyKey] !== updateEntityFormData.properties[propertyKey];
    });
    const updatedFields = mapValues(templatePropertiesUpdated, ({ format, items }, propertyKey) => {
        if (format === 'fileId') {
            return updateEntityFormData.attachmentsProperties[propertyKey] ?? null;
        }
        if (items && items.format === 'fileId' && Array.isArray(updateEntityFormData.attachmentsProperties[propertyKey])) {
            const filesArray = updateEntityFormData.attachmentsProperties[propertyKey] as File[];
            if (filesArray.length === 0) return null;
            return filesArray.map((file: File | { name: string }) => (file instanceof File ? file : file.name));
        }
        return updateEntityFormData.properties[propertyKey] ?? null;
    });
    return {
        entity: currEntity,
        updatedFields,
    };
};

type BaseActionProps = {
    isLoadingActionOnEntity: boolean;
    handleClose: () => void;
    doActionEntity: () => Promise<any>;
    currEntity?: IEntity;
    entityFormData: EntityWizardValues;
    onUpdatedRuleBlock: (brokenRules: IRuleBreachPopulated['brokenRules'], rawBrokenRules: IRuleBreach['brokenRules']) => void;
    onCreateRuleBreachRequest: () => void;
    loadEntities?: boolean;
};

export interface IActionOnSingleEntityWithRuleBreachDialogProps extends BaseActionProps {
    actionType: ActionTypes.CreateEntity | ActionTypes.DuplicateEntity | ActionTypes.UpdateEntity | ActionTypes.CreateClientSideEntity;
    brokenRules: IRuleBreachPopulated['brokenRules'];
    rawBrokenRules: IRuleBreach['brokenRules'];
    actions?: IActionPopulated[];
    rawActions?: IAction[];
}

export interface IActionOnMultipleEntitiesWithRuleBreachDialogProps extends BaseActionProps {
    actionType: ActionTypes.UpdateMultipleEntities;
    brokenRulesEntity: IBrokenRuleEntity[];
}

export type IActionOnEntityWithRuleBreachDialogProps =
    | IActionOnSingleEntityWithRuleBreachDialogProps
    | IActionOnMultipleEntitiesWithRuleBreachDialogProps;

const ActionOnEntityWithRuleBreachDialog: React.FC<IActionOnEntityWithRuleBreachDialogProps> = (componentProps) => {
    const {
        isLoadingActionOnEntity,
        handleClose,
        doActionEntity,
        actionType,
        currEntity,
        entityFormData,
        onUpdatedRuleBlock,
        onCreateRuleBreachRequest,
        loadEntities,
    } = componentProps;
    const queryClient = useQueryClient();
    const rules = queryClient.getQueryData<IRuleMap>('getRules')!;

    const { rawBrokenRules, brokenRules, actions, rawActions, entities } =
        actionType === ActionTypes.UpdateMultipleEntities
            ? {
                  rawBrokenRules: componentProps?.brokenRulesEntity?.flatMap((entity) => entity.rawBrokenRules) ?? [],
                  brokenRules: componentProps?.brokenRulesEntity?.flatMap((entity) => entity.brokenRules) ?? [],
                  actions: componentProps?.brokenRulesEntity?.flatMap((entity) => entity.actions) ?? [],
                  rawActions: componentProps?.brokenRulesEntity?.flatMap((entity) => entity.rawActions) ?? [],
                  entities: componentProps?.brokenRulesEntity?.map((entity) => entity.entities[0]) ?? [],
              }
            : {
                  rawBrokenRules: componentProps?.rawBrokenRules ?? [],
                  brokenRules: componentProps?.brokenRules ?? [],
                  actions: componentProps?.actions ?? [],
                  rawActions: componentProps?.rawActions ?? [],
                  entities: [],
              };

    let actionMetadataWithoutFiles: ICreateEntityMetadata | IDuplicateEntityMetadata | IUpdateEntityMetadata | IUpdateMultipleEntitiesMetadata;
    let actionMetadataPopulated:
        | ICreateEntityMetadataPopulated
        | IDuplicateEntityMetadataPopulated
        | IUpdateEntityMetadataPopulated
        | IUpdateMultipleEntitiesMetadataPopulated;

    const { template, properties, attachmentsProperties } = entityFormData;
    if (actionType === ActionTypes.CreateEntity) {
        actionMetadataWithoutFiles = {
            templateId: template._id,
            properties,
        } satisfies ICreateEntityMetadata;
        actionMetadataPopulated = {
            templateId: template._id,
            properties: { ...properties, ...attachmentsProperties },
        } satisfies ICreateEntityMetadataPopulated;
    } else if (actionType === ActionTypes.DuplicateEntity) {
        const fixedDuplicatedAttachmentProperties = mapValues(
            pickBy(attachmentsProperties, (value) => !(value instanceof File)),
            (file) => (Array.isArray(file) ? file.map(({ name }) => name) : file!.name),
        );
        actionMetadataWithoutFiles = {
            templateId: template._id,
            properties: { ...properties, ...fixedDuplicatedAttachmentProperties },
            entityIdToDuplicate: currEntity!.properties._id,
        } satisfies IDuplicateEntityMetadata;
        actionMetadataPopulated = {
            templateId: template._id,
            properties: { ...properties, ...attachmentsProperties, ...fixedDuplicatedAttachmentProperties }, // override fixedDuplicatedAttachmentProperties
            entityToDuplicate: currEntity!,
        } satisfies IDuplicateEntityMetadataPopulated;
    } else if (actionType === ActionTypes.UpdateEntity) {
        actionMetadataPopulated = getUpdateEntityActionMetadata(currEntity!, entityFormData);
        const updatedFieldsWithoutFiles = pickBy(actionMetadataPopulated.updatedFields, (value) => !(value instanceof File));
        actionMetadataWithoutFiles = {
            entityId: currEntity!.properties._id,
            updatedFields: updatedFieldsWithoutFiles,
        } satisfies IUpdateEntityMetadata;
    } else if (actionType === ActionTypes.UpdateMultipleEntities) {
        actionMetadataPopulated =
            entities?.map((entity) =>
                getUpdateEntityActionMetadata(
                    { properties: entity.properties as IEntity['properties'], templateId: entityFormData.template._id },
                    entityFormData,
                ),
            ) || [];

        actionMetadataWithoutFiles = (actionMetadataPopulated || [])?.map((actionMetadata) => {
            return {
                entityId: actionMetadata.entity!.properties._id,
                updatedFields: pickBy(actionMetadata.updatedFields, (value) => !(value instanceof File)),
            } satisfies IUpdateEntityMetadata;
        });
    } else {
        throw new Error('unsupported action type. cant create actionMetadata');
    }

    const { mutateAsync: createRuleBreachRequest, isLoading: isLoadingCreateRuleBreachRequest } = useMutation<
        IRuleBreachRequestPopulated,
        AxiosError,
        { overrideActions?: IAction[]; overrideBrokenRules?: IRuleBreach['brokenRules'] }
    >(
        ({ overrideActions, overrideBrokenRules }) =>
            createRuleBreachRequestRequest(
                {
                    brokenRules: overrideBrokenRules ?? rawBrokenRules,
                    actions: overrideActions ??
                        rawActions ?? [
                            {
                                actionType,
                                actionMetadata: actionMetadataWithoutFiles,
                            },
                        ],
                },
                rawActions ? undefined : attachmentsProperties,
            ),
        {
            onError: (err: AxiosError) => {
                const errorMetadata = (err.response?.data as IErrorResponse)?.metadata;
                if (errorMetadata?.errorCode === errorCodes) {
                    onUpdatedRuleBlock(errorMetadata.brokenRules, errorMetadata.rawBrokenRules);
                }
                console.error('failed to create rule breach request. error:', err);
                toast.error(<ErrorToast axiosError={err} defaultErrorMessage={i18next.t('execActionWithRuleBreach.failedToCreateRequest')} />);
            },
            onSuccess: () => {
                toast.success(i18next.t('execActionWithRuleBreach.succeededToCreateRequest'));
                handleClose();
                onCreateRuleBreachRequest();
            },
        },
    );

    return (
        <ExecWithRuleBreachDialog
            isSubmitting={isLoadingActionOnEntity || isLoadingCreateRuleBreachRequest}
            onCancel={handleClose}
            onSubmit={async () => {
                const someBrokenRuleIsEnforcement = brokenRules.some(({ ruleId }) => rules.get(ruleId)!.actionOnFail === ActionOnFail.ENFORCEMENT);

                if (someBrokenRuleIsEnforcement) {
                    if (actionType === ActionTypes.UpdateMultipleEntities) {
                        Object.values(componentProps?.brokenRulesEntity).map(
                            async ({ rawBrokenRules: currRawBrokenRules, rawActions: currRawActions }) => {
                                createRuleBreachRequest({ overrideActions: currRawActions, overrideBrokenRules: currRawBrokenRules });
                            },
                        );
                    } else if (loadEntities) {
                        const groupedRawBrokenRules = groupBrokenRulesByEntity(rawBrokenRules);
                        const groupedRawActions = groupActionsByEntityId(rawActions!);

                        groupedRawActions.map(async (overrideActions, index) =>
                            createRuleBreachRequest({ overrideActions, overrideBrokenRules: groupedRawBrokenRules[index] }),
                        );
                    } else await createRuleBreachRequest({});
                } else {
                    await doActionEntity();
                }
            }}
            brokenRules={brokenRules}
            /// that for one broken
            actionType={actionType}
            actionMetadata={actionMetadataPopulated}
            /// that for multiple broken- when there was action code
            actions={actions}
        />
    );
};

export default ActionOnEntityWithRuleBreachDialog;
