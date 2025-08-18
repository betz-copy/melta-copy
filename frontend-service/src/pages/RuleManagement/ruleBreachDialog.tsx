import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    Tab,
    Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import i18next from 'i18next';
import React, { useState } from 'react';

import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { AxiosError } from 'axios';
import { IRuleBreachAlertPopulated } from '../../interfaces/ruleBreaches/ruleBreachAlert';
import { IRuleBreachRequestPopulated, RuleBreachRequestStatus } from '../../interfaces/ruleBreaches/ruleBreachRequest';
import { approveRuleBreachRequestRequest, cancelRuleBreachRequestRequest, denyRuleBreachRequestRequest } from '../../services/ruleBreachesService';
import { BreachType } from '../../interfaces/ruleBreaches/ruleBreach';
import { environment } from '../../globals';
import { useDarkModeStore } from '../../stores/darkMode';
import { useUserStore } from '../../stores/user';
import { PermissionScope } from '../../interfaces/permissions';
import { ActionInfo } from '../../common/ruleBreanchInfo/ActionInfo';
import { BrokenRulesInfo } from '../../common/ruleBreanchInfo/BrokenRulesInfo';
import { IErrorResponse } from '../../interfaces/error';

const { errorCodes } = environment;

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
    const [value, setValue] = useState('1');

    const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };

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
                console.error('failed to review ruleBreach. error:', error);

                if ((error.response?.data as IErrorResponse)?.metadata?.errorCode === errorCodes.ruleBlock) {
                    const newRuleBreach = {
                        ...ruleBreach,
                        brokenRules: (error.response?.data as IErrorResponse)?.metadata?.brokenRules,
                    } as IRuleBreachRequestPopulated;
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
        <Dialog
            open={isOpen}
            onClose={handleClose}
            PaperProps={{ sx: { bgcolor: darkMode ? '#060606' : 'white', height: (ruleBreach?.actions?.length || 0) > 1 ? '840px' : 'fit-content' } }}
            fullWidth
        >
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
                <>
                    {(ruleBreach?.actions?.length || 0) > 1 && (
                        <TabContext value={value}>
                            <Box>
                                <TabList onChange={handleChange}>
                                    <Tab label={`${i18next.t('ruleBreachInfo.brokenRules')} ${ruleBreach.brokenRules.length}`} value="1" />
                                    <Tab label={`${i18next.t('ruleBreachInfo.actionsOrder')} ${ruleBreach.actions.length}`} value="2" />
                                </TabList>
                            </Box>
                            <TabPanel value="1">
                                <BrokenRulesInfo brokenRules={ruleBreach.brokenRules} actions={ruleBreach.actions} isCompact={false} />
                            </TabPanel>
                            <TabPanel value="2">
                                <Grid flexDirection="column">
                                    <Grid item>
                                        <Typography variant="body1">{`${i18next.t('ruleBreachInfo.actionsBrokeTheFollowingRules')}:`}</Typography>
                                    </Grid>
                                    <Grid container item paddingRight="15px">
                                        {ruleBreach.actions.map((action, index) => {
                                            return (
                                                // eslint-disable-next-line react/no-array-index-key
                                                <Grid item container key={index} spacing={2}>
                                                    <Grid item>
                                                        <Typography>{index + 1}.</Typography>
                                                    </Grid>

                                                    <Grid item>
                                                        <ActionInfo
                                                            actionType={action.actionType}
                                                            actionMetadata={action.actionMetadata}
                                                            isCompact={false}
                                                            actionIndex={index}
                                                            actions={ruleBreach.actions}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                    {ruleBreach.originUser && (
                                        <Grid item marginTop="15px">
                                            <Box component="span">{i18next.t('ruleBreachAlertNotification.by')}</Box>{' '}
                                            <Box component="span" fontWeight="bold">
                                                {ruleBreach.originUser.fullName}
                                            </Box>
                                        </Grid>
                                    )}
                                </Grid>
                            </TabPanel>
                        </TabContext>
                    )}
                    {(ruleBreach?.actions?.length || 0) === 1 && (
                        <Grid sx={{ borderRadius: '10px', padding: '20px' }}>
                            <ActionInfo
                                actionType={ruleBreach.actions[0].actionType}
                                actionMetadata={ruleBreach.actions[0].actionMetadata}
                                isCompact={false}
                                actionIndex={0}
                                actions={ruleBreach.actions}
                                originUser={ruleBreach.originUser}
                            />
                            <Divider orientation="horizontal" style={{ width: '95%', alignSelf: 'center' }} />
                            <BrokenRulesInfo brokenRules={ruleBreach.brokenRules} actions={ruleBreach.actions} isCompact={false} />
                        </Grid>
                    )}
                </>
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
