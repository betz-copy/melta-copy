import { AxiosError } from 'axios';
import i18next from 'i18next';
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import pickBy from 'lodash.pickby';
import mapValues from 'lodash.mapvalues';
import ExecWithRuleBreachDialog from '../../../common/dialogs/execWithRuleBreachDialog';
import { ErrorToast } from '../../../common/ErrorToast';
import { EntityWizardValuesNew } from '../../../common/dialogs/entity';
import { IEntity } from '../../../interfaces/entities';
import { ActionTypes, IUpdateEntityMetadata, IUpdateEntityMetadataPopulated } from '../../../interfaces/ruleBreaches/actionMetadata';
import { IRuleBreach, IRuleBreachPopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import { IRuleMap } from '../../../interfaces/rules';
import { createRuleBreachRequestRequest } from '../../../services/ruleBreachesService';
import { environment } from '../../../globals';

const { errorCodes } = environment;

const getUpdateEntityActionMetadata = (currEntity: IEntity, updateEntityFormData: EntityWizardValuesNew): IUpdateEntityMetadataPopulated => {
    const templatePropertiesUpdated = pickBy(updateEntityFormData.template.properties.properties, ({ format, items }, propertyKey) => {
        if (format === 'fileId' || (items && items.format === "fileId")) {
            const attachmentProperty = updateEntityFormData.attachmentsProperties[propertyKey];
            if (attachmentProperty instanceof File) return true;
            if (updateEntityFormData.template.properties.properties[propertyKey].items) {
                return currEntity.properties[propertyKey].some((element, index) => {
                    return element !== updateEntityFormData?.attachmentsProperties?.[propertyKey]?.[index]?.name;
                });
            }
            return currEntity.properties[propertyKey] !== updateEntityFormData.attachmentsProperties[propertyKey]?.[0].name;
        }
        return currEntity.properties[propertyKey] !== updateEntityFormData.properties[propertyKey];
    });
    
    const updatedFields = mapValues(templatePropertiesUpdated, ({ format, items }, propertyKey) => {
        if (format === 'fileId' || (items && items.format === "fileId")) {
            return updateEntityFormData.attachmentsProperties[propertyKey] ?? null;
        }
        return updateEntityFormData.properties[propertyKey] ?? null;
    });
    return {
        entity: currEntity,
        updatedFields,
    };
};


const UpdateEntityWithRuleBreachDialog: React.FC<{
    isLoadingUpdateEntity: boolean;
    handleClose: () => void;
    onUpdateEntity: () => Promise<any>;
    brokenRules: IRuleBreachPopulated['brokenRules'];
    rawBrokenRules: IRuleBreach['brokenRules'];
    currEntity: IEntity;
    updateEntityFormData: EntityWizardValuesNew;
    onUpdatedRuleBlock: (brokenRules: IRuleBreachPopulated['brokenRules'], rawBrokenRules: IRuleBreach['brokenRules']) => void;
}> = ({ isLoadingUpdateEntity, handleClose, onUpdateEntity, brokenRules, rawBrokenRules, currEntity, updateEntityFormData, onUpdatedRuleBlock }) => {
    const queryClient = useQueryClient();
    const rules = queryClient.getQueryData<IRuleMap>('getRules')!;
    const actionMetadata = getUpdateEntityActionMetadata(currEntity, updateEntityFormData);
    const { mutateAsync: createRuleBreachRequest, isLoading: isLoadingCreateRuleBreachRequest } = useMutation(
        () => {
            return createRuleBreachRequestRequest(
                {
                    brokenRules: rawBrokenRules,
                    actionType: ActionTypes.UpdateEntity,
                    actionMetadata: {
                        entityId: actionMetadata.entity!.properties._id,
                        updatedFields: actionMetadata.updatedFields,
                    } as IUpdateEntityMetadata,
                },
                updateEntityFormData.attachmentsProperties,
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
            },
        },
    );
        console.log(actionMetadata);
    return (
        <ExecWithRuleBreachDialog
            isSubmitting={isLoadingUpdateEntity || isLoadingCreateRuleBreachRequest}
            onCancel={handleClose}
            onSubmit={async () => {
                const someBrokenRuleIsEnforcement = brokenRules.some(({ ruleId }) => {
                    const rule = rules.get(ruleId)!;
                    return rule.actionOnFail === 'ENFORCEMENT';
                });

                if (someBrokenRuleIsEnforcement) {
                    await createRuleBreachRequest();
                } else {
                    await onUpdateEntity();
                }
            }}
            brokenRules={brokenRules}
            actionType={ActionTypes.UpdateEntity}
            actionMetadata={actionMetadata}
        />
    );
};

export default UpdateEntityWithRuleBreachDialog;
