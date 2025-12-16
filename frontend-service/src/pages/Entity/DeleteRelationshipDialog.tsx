import {
    ActionOnFail,
    ActionTypes,
    IDeleteRelationshipMetadata,
    IDeleteRelationshipMetadataPopulated,
    IEntityExpanded,
    IRuleBreach,
    IRuleBreachPopulated,
    IRuleMap,
} from '@microservices/shared';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { AreYouSureDialog } from '../../common/dialogs/AreYouSureDialog';
import ExecWithRuleBreachDialog from '../../common/dialogs/execWithRuleBreachDialog';
import { ErrorToast } from '../../common/ErrorToast';
import { environment } from '../../globals';
import { IErrorResponse } from '../../interfaces/error';
import { deleteRelationshipRequest } from '../../services/relationshipsService';
import { createRuleBreachRequestRequest } from '../../services/ruleBreachesService';

const { errorCodes } = environment;

const DeleteRelationshipDialog: React.FC<{
    isOpen: boolean;
    handleClose: () => void;
    connectionToDelete?: IEntityExpanded['connections'][number];
    onSubmitSuccess: () => void;
}> = ({ isOpen, handleClose, connectionToDelete, onSubmitSuccess }) => {
    const queryClient = useQueryClient();
    const rules = queryClient.getQueryData<IRuleMap>('getRules')!;

    const [deleteWithRuleBreachDialogState, setDeleteWithRuleBreachDialogState] = useState<{
        isOpen: boolean;
        brokenRules?: IRuleBreachPopulated['brokenRules'];
        rawBrokenRules?: IRuleBreach['brokenRules'];
    }>({ isOpen: false });

    const { mutateAsync: deleteRelationship, isLoading: isLoadingDeleteRelationship } = useMutation(
        () => {
            return deleteRelationshipRequest(connectionToDelete!.relationship.properties._id, {
                ignoredRules: deleteWithRuleBreachDialogState.rawBrokenRules!,
            });
        },
        {
            onError: (err: AxiosError) => {
                const errorMetadata = (err.response?.data as IErrorResponse)?.metadata;
                if (errorMetadata?.errorCode === errorCodes.ruleBlock) {
                    setDeleteWithRuleBreachDialogState({
                        isOpen: true,
                        brokenRules: errorMetadata.brokenRules,
                        rawBrokenRules: errorMetadata.rawBrokenRules,
                    });
                }

                console.error('failed to delete relationship. error:', err);
                toast.error(<ErrorToast axiosError={err} defaultErrorMessage={i18next.t('entityPage.failedToDeleteRelationship')} />);
            },
            onSuccess: () => {
                setDeleteWithRuleBreachDialogState({ isOpen: false });
                onSubmitSuccess();
                toast.success(i18next.t('entityPage.succeededToDeleteRelationship'));
            },
        },
    );

    const { mutateAsync: createRuleBreachRequest, isLoading: isLoadingCreateRuleBreachRequest } = useMutation(
        () => {
            return createRuleBreachRequestRequest({
                brokenRules: deleteWithRuleBreachDialogState.rawBrokenRules!,
                actions: [
                    {
                        actionType: ActionTypes.DeleteRelationship,
                        actionMetadata: {
                            relationshipTemplateId: connectionToDelete!.relationship.templateId,
                            relationshipId: connectionToDelete!.relationship.properties._id,
                            sourceEntityId: connectionToDelete!.sourceEntity.properties._id,
                            destinationEntityId: connectionToDelete!.destinationEntity.properties._id,
                        } as IDeleteRelationshipMetadata,
                    },
                ],
            });
        },
        {
            onError: (err: AxiosError) => {
                const errorMetadata = (err.response?.data as IErrorResponse)?.metadata;
                if (errorMetadata?.errorCode === environment.errorCodes) {
                    setDeleteWithRuleBreachDialogState({
                        isOpen: true,
                        brokenRules: errorMetadata.brokenRules,
                    });
                }

                console.error('failed to create rule breach request. error:', err);
                toast.error(<ErrorToast axiosError={err} defaultErrorMessage={i18next.t('execActionWithRuleBreach.failedToCreateRequest')} />);
            },
            onSuccess: () => {
                setDeleteWithRuleBreachDialogState({ isOpen: false });
                handleClose();
                toast.success(i18next.t('execActionWithRuleBreach.succeededToCreateRequest'));
            },
        },
    );
    return (
        <>
            <AreYouSureDialog
                open={isOpen}
                handleClose={handleClose}
                onYes={async () => deleteRelationship()}
                isLoading={isLoadingDeleteRelationship}
            />

            {deleteWithRuleBreachDialogState.isOpen && (
                <ExecWithRuleBreachDialog
                    isSubmitting={isLoadingDeleteRelationship || isLoadingCreateRuleBreachRequest}
                    onCancel={() => setDeleteWithRuleBreachDialogState({ isOpen: false })}
                    onSubmit={async () => {
                        const someBrokenRuleIsEnforcement = deleteWithRuleBreachDialogState.brokenRules!.some(
                            ({ ruleId }) => rules.get(ruleId)!.actionOnFail === ActionOnFail.ENFORCEMENT,
                        );

                        if (someBrokenRuleIsEnforcement) {
                            await createRuleBreachRequest();
                        } else {
                            await deleteRelationship();
                        }
                    }}
                    brokenRules={deleteWithRuleBreachDialogState.brokenRules!}
                    actionType={ActionTypes.DeleteRelationship}
                    actionMetadata={
                        {
                            relationshipTemplateId: connectionToDelete!.relationship.templateId,
                            relationshipId: connectionToDelete!.relationship.properties._id,
                            sourceEntity: connectionToDelete!.sourceEntity,
                            destinationEntity: connectionToDelete!.destinationEntity,
                        } as IDeleteRelationshipMetadataPopulated
                    }
                />
            )}
        </>
    );
};

export default DeleteRelationshipDialog;
