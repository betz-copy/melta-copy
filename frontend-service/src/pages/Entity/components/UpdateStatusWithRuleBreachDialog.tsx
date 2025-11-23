import { AxiosError } from 'axios';
import i18next from 'i18next';
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import ExecWithRuleBreachDialog from '../../../common/dialogs/execWithRuleBreachDialog';
import { ErrorToast } from '../../../common/ErrorToast';
import { IEntity } from '../../../interfaces/entities';
import { IErrorResponse } from '../../../interfaces/error';
import { ActionTypes, IUpdateEntityStatusMetadata, IUpdateEntityStatusMetadataPopulated } from '../../../interfaces/ruleBreaches/actionMetadata';
import { IRuleBreach, IRuleBreachPopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import { ActionOnFail, IRuleMap } from '../../../interfaces/rules';
import { createRuleBreachRequestRequest } from '../../../services/ruleBreachesService';

const getActionMetadata = (currEntity: IEntity, disabledStatus: boolean): IUpdateEntityStatusMetadataPopulated => {
    return {
        entity: currEntity,
        disabled: disabledStatus,
    };
};
const UpdateStatusWithRuleBreachDialog: React.FC<{
    isLoadingUpdateEntity: boolean;
    handleClose: () => void;
    onUpdateStatus: () => Promise<any>;
    brokenRules: IRuleBreachPopulated['brokenRules'];
    rawBrokenRules: IRuleBreach['brokenRules'];
    currEntity: IEntity;
    disabled: boolean;
    onUpdatedRuleBlock: (brokenRules: IRuleBreachPopulated['brokenRules'], rawBrokenRules: IRuleBreach['brokenRules']) => void;
}> = ({ isLoadingUpdateEntity, handleClose, onUpdateStatus, brokenRules, rawBrokenRules, currEntity, disabled, onUpdatedRuleBlock }) => {
    const queryClient = useQueryClient();
    const rules = queryClient.getQueryData<IRuleMap>('getRules')!;
    const actionMetadata = getActionMetadata(currEntity, disabled);
    const { mutateAsync: createRuleBreachRequest, isLoading: isLoadingCreateRuleBreachRequest } = useMutation(
        () => {
            return createRuleBreachRequestRequest({
                brokenRules: rawBrokenRules,
                actions: [
                    {
                        actionType: ActionTypes.UpdateStatus,
                        actionMetadata: { entityId: actionMetadata.entity?.properties._id, disabled } as IUpdateEntityStatusMetadata,
                    },
                ],
            });
        },
        {
            onError: (err: AxiosError) => {
                const errorMetadata = (err.response?.data as IErrorResponse)?.metadata;
                if (errorMetadata?.errorCode === 'RULE_BLOCK') {
                    onUpdatedRuleBlock(errorMetadata.brokenRules, errorMetadata.rawBrokenRules);
                }

                console.error('failed to create rule breach request. error:', err);
                toast.error(<ErrorToast axiosError={err} defaultErrorMessage={i18next.t('execActionWithRuleBreach.failedToCreateRequest')} />);
            },
            onSuccess: () => {
                toast.success(i18next.t('execActionWithRuleBreach.succeededToCreateRequest'));
                handleClose();
            },
        },
    );

    return (
        <ExecWithRuleBreachDialog
            isSubmitting={isLoadingUpdateEntity || isLoadingCreateRuleBreachRequest}
            onCancel={handleClose}
            onSubmit={async () => {
                const someBrokenRuleIsEnforcement = brokenRules.some(({ ruleId }) => rules.get(ruleId)!.actionOnFail === ActionOnFail.ENFORCEMENT);

                if (someBrokenRuleIsEnforcement) {
                    await createRuleBreachRequest();
                } else {
                    await onUpdateStatus();
                }
            }}
            brokenRules={brokenRules}
            actionType={ActionTypes.UpdateStatus}
            actionMetadata={actionMetadata}
        />
    );
};

export default UpdateStatusWithRuleBreachDialog;
