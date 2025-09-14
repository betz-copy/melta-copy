import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useQueryClient } from 'react-query';
import { ActionTypes, IActionMetadataPopulated, IActionPopulated } from '../../../interfaces/ruleBreaches/actionMetadata';
import { IRuleBreachPopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import { ActionOnFail, IRuleMap } from '../../../interfaces/rules';
import { useDarkModeStore } from '../../../stores/darkMode';
import MeltaTooltip from '../../MeltaDesigns/MeltaTooltip';
import RuleBreachInfo from '../../ruleBreanchInfo/RuleBreachInfo';

const ExecWithRuleBreachDialog: React.FC<{
    isSubmitting: boolean;
    onCancel: () => void;
    onSubmit: () => void;
    brokenRules: IRuleBreachPopulated['brokenRules'];
    actionType: ActionTypes;
    actionMetadata: IActionMetadataPopulated;
    actions?: IActionPopulated[];
}> = ({ isSubmitting, onCancel, onSubmit, brokenRules, actionType, actionMetadata, actions }) => {
    const queryClient = useQueryClient();
    const rules = queryClient.getQueryData<IRuleMap>('getRules')!;

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const someBrokenRuleIsEnforcement = brokenRules.some(({ ruleId }) => rules.get(ruleId)!.actionOnFail === ActionOnFail.ENFORCEMENT);

    return (
        <Dialog
            open
            fullWidth
            maxWidth="sm"
            slotProps={{ paper: { sx: { bgcolor: darkMode ? '#060606' : 'white', borderColor: 'red', borderWidth: '2px', borderStyle: 'dashed' } } }}
        >
            <DialogTitle>
                {i18next.t('execActionWithRuleBreach.actionBroke')}
                {brokenRules.length === 1
                    ? ` ${i18next.t('execActionWithRuleBreach.rule')}`
                    : ` ${brokenRules.length} ${i18next.t('execActionWithRuleBreach.rules')}`}
            </DialogTitle>
            <DialogContent>
                <RuleBreachInfo brokenRules={brokenRules} actions={actions ?? [{ actionType, actionMetadata }]} isCompact={false} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>{i18next.t('execActionWithRuleBreach.cancel')}</Button>
                <MeltaTooltip
                    title={
                        someBrokenRuleIsEnforcement
                            ? i18next.t('execActionWithRuleBreach.createRequestTooltip')!
                            : i18next.t('execActionWithRuleBreach.execActionWithAlertTooltip')!
                    }
                    placement="top"
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
                </MeltaTooltip>
            </DialogActions>
        </Dialog>
    );
};

export default ExecWithRuleBreachDialog;
