import React, { useEffect, useRef, useState } from 'react';
import i18next from 'i18next';
import { CircularProgress, Grid } from '@mui/material';
import { useNavigate, useParams } from 'react-router';
import { useQuery, useQueryClient } from 'react-query';
import { RuleBreachTable } from './table';
import { IRuleBreachAlertPopulated } from '../../interfaces/ruleBreaches/ruleBreachAlert';
import { IRuleBreachRequestPopulated } from '../../interfaces/ruleBreaches/ruleBreachRequest';
import RuleBreachDialog from './ruleBreachDialog';
import { BreachType } from '../../interfaces/ruleBreaches/ruleBreach';
import '../../css/pages.css';
import { BlueTitle } from '../../common/BlueTitle';
import { getBreachAlertById, getBreachRequestById } from '../../services/ruleBreachesService';
import { environment } from '../../globals';

const { defaultRowHeight } = environment.agGrid;

interface RuleBreachDialogContainerProps {
    breachType: string;
    ruleBreachId: string;
    ruleBreachRequestsRef: React.RefObject<{
        refreshBreaches: () => void;
    }>;
    rule: IRuleBreachAlertPopulated | IRuleBreachRequestPopulated | null;
}
export const RuleBreachDialogContainer: React.FC<RuleBreachDialogContainerProps> = ({ ruleBreachId, ruleBreachRequestsRef, rule, breachType }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(true);
    const queryClient = useQueryClient();

    const navigate = useNavigate();

    const getRuleBreach = () => {
        switch (breachType) {
            case 'alert':
                return getBreachAlertById(ruleBreachId);

            case 'request':
                return getBreachRequestById(ruleBreachId);

            default:
                throw new Error(`invalid breachType ${breachType}`);
        }
    };

    const { data: ruleBreach, isLoading } = useQuery(['getRuleBreach', ruleBreachId], getRuleBreach, {
        initialData: rule,
        retry: false,
        onError: (err) => {
            console.log(err);
            navigate('/404');
        },
    });

    const onUpdatedRuleBreach = (newRuleBreach: IRuleBreachRequestPopulated) => {
        queryClient.setQueryData<IRuleBreachAlertPopulated | IRuleBreachRequestPopulated>(['getRuleBreach', ruleBreachId], newRuleBreach);
    };

    if (isLoading) {
        return (
            <Grid container justifyContent="center">
                <CircularProgress />
            </Grid>
        );
    }

    return (
        <RuleBreachDialog
            isOpen={isDialogOpen}
            ruleBreach={ruleBreach!}
            breachType={breachType as BreachType}
            refreshBreaches={ruleBreachRequestsRef.current?.refreshBreaches!}
            handleClose={() => {
                setIsDialogOpen(false);
                navigate('/rule-management');
            }}
            onUpdatedRuleBreach={onUpdatedRuleBreach}
        />
    );
};

const RuleManagement: React.FC<{ setTitle: React.Dispatch<React.SetStateAction<string>> }> = ({ setTitle }) => {
    const { '*': allParams } = useParams();
    const [breachType, ruleBreachId] = allParams!.split('/');
    const navigate = useNavigate();
    const [ruleBreach, setRuleBreach] = useState<IRuleBreachAlertPopulated | IRuleBreachRequestPopulated | null>(null);
    useEffect(() => setTitle(i18next.t('pages.ruleManagement')), [setTitle]);

    const onReviewBreachClick = async (ruleBreachClicked: IRuleBreachAlertPopulated | IRuleBreachRequestPopulated, ruleBreachType: BreachType) => {
        setRuleBreach(ruleBreachClicked);
        navigate(`/rule-management/${ruleBreachType}/${ruleBreachClicked._id}`);
    };
    const ruleBreachRequestsRef = useRef<React.ComponentRef<typeof RuleBreachTable>>(null);

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
            {breachType && ruleBreachId && (
                <RuleBreachDialogContainer
                    breachType={breachType}
                    rule={ruleBreach}
                    ruleBreachId={ruleBreachId}
                    ruleBreachRequestsRef={ruleBreachRequestsRef}
                />
            )}
        </Grid>
    );
};

export default RuleManagement;
