import { AxiosError } from 'axios';
import i18next from 'i18next';
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { ActionTypes, ICreateRelationshipMetadata, ICreateRelationshipMetadataPopulated } from '../../../interfaces/ruleBreaches/actionMetadata';
import { IRuleBreach, IRuleBreachPopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import { IRuleMap } from '../../../interfaces/rules';
import { createRuleBreachRequestRequest } from '../../../services/ruleBreachesService';
import { ErrorToast } from '../../ErrorToast';
import ExecWithRuleBreachDialog from '../execWithRuleBreachDialog';
import { environment } from '../../../globals';
import { IErrorResponse } from '../../../interfaces/error';

const { errorCodes } = environment;

const CreateWithRuleBreachDialog: React.FC<{
    handleClose: () => void;
    brokenRules: IRuleBreachPopulated['brokenRules'];
    rawBrokenRules: IRuleBreach['brokenRules'];
    actionMetadata: ICreateRelationshipMetadataPopulated;
    onCreateRelationship: () => Promise<void>;
    isLoadingCreateRelationship: boolean;
    onCreateRuleBreachRequest: () => void;
    onUpdatedRuleBlock: (brokenRules: IRuleBreachPopulated['brokenRules'], rawBrokenRules: IRuleBreach['brokenRules']) => void;
}> = ({
    handleClose,
    brokenRules,
    rawBrokenRules,
    actionMetadata,
    onCreateRelationship,
    isLoadingCreateRelationship,
    onCreateRuleBreachRequest,
    onUpdatedRuleBlock,
}) => {
    const queryClient = useQueryClient();
    const rules = queryClient.getQueryData<IRuleMap>('getRules')!;

    const { mutateAsync: createRuleBreachRequest, isLoading: isLoadingCreateRuleBreachRequest } = useMutation(
        () => {
            return createRuleBreachRequestRequest({
                brokenRules: rawBrokenRules,
                actions: [
                    {
                        actionType: ActionTypes.CreateRelationship,
                        actionMetadata: {
                            relationshipTemplateId: actionMetadata.relationshipTemplateId,
                            sourceEntityId:
                                typeof actionMetadata.sourceEntity === 'string'
                                    ? actionMetadata.sourceEntity
                                    : actionMetadata.sourceEntity?.properties?._id || '',
                            destinationEntityId:
                                typeof actionMetadata.destinationEntity === 'string'
                                    ? actionMetadata.destinationEntity
                                    : actionMetadata.destinationEntity?.properties?._id || '',
                        } as ICreateRelationshipMetadata,
                    },
                ],
            });
        },
        {
            onError: (err: AxiosError) => {
                const errorMetadata = (err.response?.data as IErrorResponse)?.metadata;
                if (errorMetadata?.errorCode === errorCodes.ruleBlock) {
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
            isSubmitting={isLoadingCreateRelationship || isLoadingCreateRuleBreachRequest}
            onCancel={handleClose}
            onSubmit={async () => {
                const someBrokenRuleIsEnforcement = brokenRules.some(({ ruleId }) => {
                    const rule = rules.get(ruleId)!;
                    return rule.actionOnFail === 'ENFORCEMENT';
                });

                if (someBrokenRuleIsEnforcement) {
                    await createRuleBreachRequest();
                } else {
                    await onCreateRelationship();
                }
                handleClose();
            }}
            brokenRules={brokenRules}
            actionType={ActionTypes.CreateRelationship}
            actionMetadata={actionMetadata!}
        />
    );
};

export default CreateWithRuleBreachDialog;
