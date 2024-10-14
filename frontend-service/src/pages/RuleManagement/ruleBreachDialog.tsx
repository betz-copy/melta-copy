import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import i18next from 'i18next';
import React from 'react';

import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import RuleBreachInfo from '../../common/ruleBreanchInfo/RuleBreachInfo';
import { IRuleBreachAlertPopulated } from '../../interfaces/ruleBreaches/ruleBreachAlert';
import { IRuleBreachRequestPopulated, RuleBreachRequestStatus } from '../../interfaces/ruleBreaches/ruleBreachRequest';
import { approveRuleBreachRequestRequest, cancelRuleBreachRequestRequest, denyRuleBreachRequestRequest } from '../../services/ruleBreachesService';
import { BreachType } from '../../interfaces/ruleBreaches/ruleBreach';
import { environment } from '../../globals';
import { useDarkModeStore } from '../../stores/darkMode';
import { useUserStore } from '../../stores/user';
import { PermissionScope } from '../../interfaces/permissions';

const { errorCodes } = environment.staticConfigs;

const RuleBreachDialog: React.FC<{
    isOpen: boolean;
    ruleBreach: IRuleBreachAlertPopulated | IRuleBreachRequestPopulated | null;
    breachType: BreachType | null;
    refreshBreaches: () => void;
    handleClose: () => void;
    onUpdatedRuleBreach: (ruleBreachRequest: IRuleBreachRequestPopulated) => void;
}> = ({ isOpen, handleClose, ruleBreach, breachType, refreshBreaches, onUpdatedRuleBreach }) => {
    const currentUser = useUserStore((state) => state.user);
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const { mutateAsync: updateRequestStatus, isLoading: isLoadingReviewRuleBrach } = useMutation(
        (status: RuleBreachRequestStatus) => {
            if (status === RuleBreachRequestStatus.Approved) {
                return approveRuleBreachRequestRequest(ruleBreach!._id);
            }

            if (status === RuleBreachRequestStatus.Denied) {
                return denyRuleBreachRequestRequest(ruleBreach!._id);
            }

            if (status === RuleBreachRequestStatus.Canceled) {
                return cancelRuleBreachRequestRequest(ruleBreach!._id);
            }

            throw new Error('unknown request status');
        },
        {
            onError: (error: AxiosError, status) => {
                console.log('failed to review ruleBreach. error:', error);

                if (error.response?.data?.metadata?.errorCode === errorCodes.ruleBlock) {
                    const newRuleBreach = { ...ruleBreach, brokenRules: error.response?.data?.metadata?.brokenRules } as IRuleBreachRequestPopulated;
                    onUpdatedRuleBreach(newRuleBreach);

                    toast.error(i18next.t('ruleManagement.newBreachDetected'));
                } else {
                    if (status === RuleBreachRequestStatus.Approved) {
                        toast.error(i18next.t('ruleManagement.failedToApprove'));
                    }

                    if (status === RuleBreachRequestStatus.Denied) {
                        toast.error(i18next.t('ruleManagement.failedToDeny'));
                    }

                    if (status === RuleBreachRequestStatus.Canceled) {
                        toast.error(i18next.t('ruleManagement.failedToCancel'));
                    }
                }
            },
            onSuccess: (data, status) => {
                refreshBreaches();
                onUpdatedRuleBreach(data);
                handleClose();
                if (status === RuleBreachRequestStatus.Approved) {
                    toast.success(i18next.t('ruleManagement.succeededToApprove'));
                }

                if (status === RuleBreachRequestStatus.Denied) {
                    toast.success(i18next.t('ruleManagement.succeededToDeny'));
                }

                if (status === RuleBreachRequestStatus.Canceled) {
                    toast.success(i18next.t('ruleManagement.succeededToCancel'));
                }
            },
        },
    );

    if (!ruleBreach) return <div />;

    return (
        <Dialog open={isOpen} onClose={handleClose} PaperProps={{ sx: { bgcolor: darkMode ? '#060606' : 'white' } }} fullWidth>
            <DialogTitle>
                {i18next.t('ruleManagement.breachDetails')}
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    sx={{
                        position: 'absolute',
                        right: 12,
                        top: 12,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <RuleBreachInfo
                    originUser={ruleBreach.originUser}
                    brokenRules={ruleBreach.brokenRules}
                    actions={ruleBreach.actions}
                    isCompact={false}
                />
            </DialogContent>
            {breachType === 'request' &&
                (ruleBreach as IRuleBreachRequestPopulated).status === RuleBreachRequestStatus.Pending &&
                (currentUser.currentWorkspacePermissions.rules?.scope === PermissionScope.write ||
                currentUser.currentWorkspacePermissions.admin?.scope === PermissionScope.write ? (
                    <DialogActions style={{ justifyContent: 'space-evenly' }}>
                        <Button
                            variant="contained"
                            onClick={() => updateRequestStatus(RuleBreachRequestStatus.Approved)}
                            disabled={isLoadingReviewRuleBrach}
                        >
                            {i18next.t('ruleManagement.approveRequest')}
                            {isLoadingReviewRuleBrach && <CircularProgress size={20} />}
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={() => updateRequestStatus(RuleBreachRequestStatus.Denied)}
                            disabled={isLoadingReviewRuleBrach}
                        >
                            {i18next.t('ruleManagement.denyRequest')}
                            {isLoadingReviewRuleBrach && <CircularProgress size={20} />}
                        </Button>
                    </DialogActions>
                ) : (
                    <DialogActions style={{ justifyContent: 'space-evenly' }}>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={() => updateRequestStatus(RuleBreachRequestStatus.Canceled)}
                            disabled={isLoadingReviewRuleBrach}
                        >
                            {i18next.t('ruleManagement.cancelRequest')}
                            {isLoadingReviewRuleBrach && <CircularProgress size={20} />}
                        </Button>
                    </DialogActions>
                ))}
        </Dialog>
    );
};

export default RuleBreachDialog;
