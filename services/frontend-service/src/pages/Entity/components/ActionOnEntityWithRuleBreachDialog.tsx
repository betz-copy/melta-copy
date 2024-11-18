import { AxiosError } from 'axios';
import i18next from 'i18next';
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import pickBy from 'lodash.pickby';
import mapValues from 'lodash.mapvalues';
import { IEntity } from '@microservices/shared';
import ExecWithRuleBreachDialog from '../../../common/dialogs/execWithRuleBreachDialog';
import { ErrorToast } from '../../../common/ErrorToast';
import { EntityWizardValues } from '../../../common/dialogs/entity';
import {
    ActionTypes,
    IAction,
    IActionPopulated,
    ICreateEntityMetadata,
    ICreateEntityMetadataPopulated,
    IDuplicateEntityMetadata,
    IDuplicateEntityMetadataPopulated,
    IUpdateEntityMetadata,
    IUpdateEntityMetadataPopulated,
} from '../../../interfaces/ruleBreaches/actionMetadata';
import { IRuleBreach, IRuleBreachPopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import { IRuleMap } from '../../../interfaces/rules';
import { createRuleBreachRequestRequest } from '../../../services/ruleBreachesService';
import { environment } from '../../../globals';

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

interface IActionOnEntityWithRuleBreachDialogProps {
    isLoadingActionOnEntity: boolean;
    handleClose: () => void;
    doActionEntity: () => Promise<any>;
    actionType: ActionTypes.CreateEntity | ActionTypes.DuplicateEntity | ActionTypes.UpdateEntity;
    currEntity?: IEntity;
    brokenRules: IRuleBreachPopulated['brokenRules'];
    rawBrokenRules: IRuleBreach['brokenRules'];
    entityFormData: EntityWizardValues;
    onUpdatedRuleBlock: (brokenRules: IRuleBreachPopulated['brokenRules'], rawBrokenRules: IRuleBreach['brokenRules']) => void;
    onCreateRuleBreachRequest: () => void;
    actions?: IActionPopulated[];
    rawActions?: IAction[];
}

const ActionOnEntityWithRuleBreachDialog: React.FC<IActionOnEntityWithRuleBreachDialogProps> = ({
    isLoadingActionOnEntity,
    handleClose,
    doActionEntity,
    actionType,
    currEntity,
    brokenRules,
    rawBrokenRules,
    entityFormData,
    onUpdatedRuleBlock,
    onCreateRuleBreachRequest,
    actions,
    rawActions,
}) => {
    const queryClient = useQueryClient();
    const rules = queryClient.getQueryData<IRuleMap>('getRules')!;

    let actionMetadataWithoutFiles: ICreateEntityMetadata | IDuplicateEntityMetadata | IUpdateEntityMetadata;
    let actionMetadataPopulated: ICreateEntityMetadataPopulated | IDuplicateEntityMetadataPopulated | IUpdateEntityMetadataPopulated;

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
    } else {
        throw new Error('unsupported action type. cant create actionMetadata');
    }

    const { mutateAsync: createRuleBreachRequest, isLoading: isLoadingCreateRuleBreachRequest } = useMutation(
        () => {
            return createRuleBreachRequestRequest(
                {
                    brokenRules: rawBrokenRules,
                    actions: rawActions ?? [
                        {
                            actionType,
                            actionMetadata: actionMetadataWithoutFiles,
                        },
                    ],
                },
                rawActions ? undefined : attachmentsProperties,
            );
        },
        {
            onError: (err: AxiosError) => {
                const errorMetadata = err.response?.data?.metadata;
                if (errorMetadata?.errorCode === errorCodes) {
                    onUpdatedRuleBlock(errorMetadata.brokenRules, errorMetadata.rawBrokenRules);
                }

                console.log('failed to create rule breach request. error:', err);
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
                const someBrokenRuleIsEnforcement = brokenRules.some(({ ruleId }) => {
                    const rule = rules.get(ruleId)!;
                    return rule.actionOnFail === 'ENFORCEMENT';
                });

                if (someBrokenRuleIsEnforcement) {
                    await createRuleBreachRequest();
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
