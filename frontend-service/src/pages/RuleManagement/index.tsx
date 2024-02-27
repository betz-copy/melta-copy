import React, { useEffect, useRef, useState } from 'react';
import i18next from 'i18next';
import { Grid } from '@mui/material';

import { RuleBreachTable } from './table';
import { IRuleBreachAlertPopulated } from '../../interfaces/ruleBreaches/ruleBreachAlert';
import { IRuleBreachRequestPopulated } from '../../interfaces/ruleBreaches/ruleBreachRequest';
import RuleBreachDialog from './ruleBreachDialog';
import { BreachType } from '../../interfaces/ruleBreaches/ruleBreach';

import '../../css/pages.css';
import { BlueTitle } from '../../common/BlueTitle';
import { environment } from '../../globals';

const { defaultRowHeight } = environment.agGrid;

const RuleManagement: React.FC<{ setTitle: React.Dispatch<React.SetStateAction<string>> }> = ({ setTitle }) => {
    const [ruleBreachDialogState, setRuleBreachDialogState] = useState<{
        isDialogOpen: boolean;
        ruleBreach: IRuleBreachAlertPopulated | IRuleBreachRequestPopulated | null;
        breachType: BreachType | null;
    }>({
        isDialogOpen: false,
        ruleBreach: null,
        breachType: null,
    });

    useEffect(() => setTitle(i18next.t('pages.ruleManagement')), [setTitle]);

    const onReviewBreachClick = (ruleBreach: IRuleBreachAlertPopulated | IRuleBreachRequestPopulated, breachType: BreachType) => {
        setRuleBreachDialogState({ isDialogOpen: true, ruleBreach, breachType });
    };

    const ruleBreachRequestsRef = useRef<React.ComponentRef<typeof RuleBreachTable>>(null);

    const onUpdatedRuleBreach = (newRuleBreach: IRuleBreachRequestPopulated) => {
        setRuleBreachDialogState((prevDialogState) => ({ ...prevDialogState, ruleBreach: newRuleBreach }));
    };

    return (
        <Grid container className="pageMargin" spacing={3}>
            <Grid item xs={12}>
                <BlueTitle title={i18next.t('ruleManagement.alerts')} component="h5" variant="h5" />
                <RuleBreachTable
                    rowHeight={defaultRowHeight}
                    fontSize="16px"
                    minColumnWidth={200}
                    breachType="alert"
                    onReviewBreachClick={onReviewBreachClick}
                />
            </Grid>
            <Grid item xs={12}>
                <BlueTitle title={i18next.t('ruleManagement.requests')} component="h5" variant="h5" />
                <RuleBreachTable
                    ref={ruleBreachRequestsRef}
                    rowHeight={defaultRowHeight}
                    fontSize="16px"
                    minColumnWidth={200}
                    breachType="request"
                    onReviewBreachClick={onReviewBreachClick}
                />
            </Grid>
            <RuleBreachDialog
                isOpen={ruleBreachDialogState.isDialogOpen}
                ruleBreach={ruleBreachDialogState.ruleBreach}
                breachType={ruleBreachDialogState.breachType}
                refreshBreaches={ruleBreachRequestsRef.current?.refreshBreaches!}
                handleClose={() => setRuleBreachDialogState({ isDialogOpen: false, ruleBreach: null, breachType: null })}
                onUpdatedRuleBreach={onUpdatedRuleBreach}
            />
        </Grid>
    );
};

export default RuleManagement;
