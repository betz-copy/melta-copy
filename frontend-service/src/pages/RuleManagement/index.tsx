import { CircularProgress, Grid } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useLocation, useParams } from 'wouter';
import BlueTitle from '../../common/MeltaDesigns/BlueTitle';
import '../../css/pages.css';
import { BreachType, IRuleBreachAlertPopulated, IRuleBreachRequestPopulated } from '@packages/rule-breach';
import { getBreachAlertById, getBreachRequestById } from '../../services/ruleBreachesService';
import { useWorkspaceStore } from '../../stores/workspace';
import RuleBreachDialog from './ruleBreachDialog';
import { RuleBreachTable } from './table';

interface RuleBreachDialogContainerProps {
    breachType: string;
    ruleBreachId: string;
    ruleBreachRequestsRef: React.RefObject<{
        refreshBreaches: () => void;
    } | null>;
    rule: IRuleBreachAlertPopulated | IRuleBreachRequestPopulated | null;
}
export const RuleBreachDialogContainer: React.FC<RuleBreachDialogContainerProps> = ({ ruleBreachId, ruleBreachRequestsRef, rule, breachType }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(true);
    const queryClient = useQueryClient();

    const [_, navigate] = useLocation();

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
            console.error(err);
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
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { defaultRowHeight, defaultFontSize } = workspace.metadata.agGrid;

    const { breachType, ruleBreachId } = useParams<{ breachType: string; ruleBreachId: string }>();
    const [_, navigate] = useLocation();
    const [ruleBreach, setRuleBreach] = useState<IRuleBreachAlertPopulated | IRuleBreachRequestPopulated | null>(null);
    useEffect(() => setTitle(i18next.t('pages.ruleManagement')), [setTitle]);

    const onReviewBreachClick = async (ruleBreachClicked: IRuleBreachAlertPopulated | IRuleBreachRequestPopulated, ruleBreachType: BreachType) => {
        setRuleBreach(ruleBreachClicked);
        navigate(`/rule-management/${ruleBreachType}/${ruleBreachClicked._id}`);
    };
    const ruleBreachRequestsRef = useRef<React.ComponentRef<typeof RuleBreachTable>>(null);

    return (
        <Grid container className="pageMargin" spacing={3}>
            <Grid size={{ xs: 12 }}>
                <BlueTitle title={i18next.t('ruleManagement.alerts')} component="h5" variant="h5" />
                <RuleBreachTable
                    rowHeight={defaultRowHeight}
                    fontSize={`${defaultFontSize}px`}
                    minColumnWidth={200}
                    breachType="alert"
                    onReviewBreachClick={onReviewBreachClick}
                />
            </Grid>
            <Grid size={{ xs: 12 }}>
                <BlueTitle title={i18next.t('ruleManagement.requests')} component="h5" variant="h5" />
                <RuleBreachTable
                    ref={ruleBreachRequestsRef}
                    rowHeight={defaultRowHeight}
                    fontSize={`${defaultFontSize}px`}
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
