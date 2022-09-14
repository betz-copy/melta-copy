import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Tooltip } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useQueryClient } from 'react-query';
import { ActionTypes, IActionMetadataPopulated } from '../../../interfaces/ruleBreaches/actionMetadata';
import { IRuleBreachPopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import { IMongoRule } from '../../../interfaces/rules';
import RuleBreachInfo from '../../ruleBreanchInfo/RuleBreachInfo';

const ExecWithRuleBreachDialog: React.FC<{
    isSubmitting: boolean;
    onCancel: () => void;
    onSubmit: () => void;
    brokenRules: IRuleBreachPopulated['brokenRules'];
    actionType: ActionTypes;
    actionMetadata: IActionMetadataPopulated;
}> = ({ isSubmitting, onCancel, onSubmit, brokenRules, actionType, actionMetadata }) => {
    const queryClient = useQueryClient();
    const rules = queryClient.getQueryData<IMongoRule[]>('getRules')!;

    const someBrokenRuleIsEnforcement = brokenRules.some(({ ruleId }) => {
        const rule = rules.find((currRule) => currRule._id === ruleId)!;
        return rule.actionOnFail === 'ENFORCEMENT';
    });

    return (
        <Dialog
            open
            fullWidth
            maxWidth="sm"
            sx={{
                '& .MuiPaper-root': {
                    borderColor: 'red',
                    borderWidth: '3px',
                    borderStyle: 'solid',
                },
            }}
        >
            <DialogTitle>
                {i18next.t('execActionWithRuleBreach.actionBroke')}{' '}
                {brokenRules.length === 1
                    ? i18next.t('execActionWithRuleBreach.rule')
                    : `${brokenRules.length} ${i18next.t('execActionWithRuleBreach.rules')}`}
            </DialogTitle>
            <DialogContent>
                <RuleBreachInfo brokenRules={brokenRules} actionType={actionType} actionMetadata={actionMetadata} isCompact={false} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>{i18next.t('execActionWithRuleBreach.cancel')}</Button>
                <Tooltip
                    title={
                        someBrokenRuleIsEnforcement
                            ? i18next.t('execActionWithRuleBreach.createRequestTooltip')!
                            : i18next.t('execActionWithRuleBreach.execActionWithAlertTooltip')!
                    }
                    placement="top"
                    arrow
                    PopperProps={{
                        sx: { '& .MuiTooltip-tooltip': { fontSize: '0.8rem' } },
                    }}
                >
                    <span>
                        <Button
                            disabled={isSubmitting}
                            onClick={onSubmit}
                            variant="contained"
                            color={someBrokenRuleIsEnforcement ? 'primary' : 'warning'}
                        >
                            {someBrokenRuleIsEnforcement
                                ? i18next.t('execActionWithRuleBreach.createRequest')
                                : i18next.t('execActionWithRuleBreach.execActionWithAlert')}
                            {isSubmitting && <CircularProgress size={20} />}
                        </Button>
                    </span>
                </Tooltip>
            </DialogActions>
        </Dialog>
    );
};

export default ExecWithRuleBreachDialog;
