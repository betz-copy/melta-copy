import { ActionOnFail, IMongoRule } from '@microservices/shared';
import { Gavel as GavelIcon } from '@mui/icons-material';
import { Icon } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import MeltaTooltip from '../../MeltaDesigns/MeltaTooltip';

interface RuleIconProps {
    ruleType: IMongoRule['actionOnFail'];
}

export const RuleIcon: React.FC<RuleIconProps> = ({ ruleType }) => {
    return (
        <MeltaTooltip title={ruleType === ActionOnFail.WARNING ? i18next.t('ruleBreachInfo.warning') : i18next.t('ruleBreachInfo.enforcement')}>
            <Icon>
                <GavelIcon style={{ color: ruleType === ActionOnFail.WARNING ? '#FFAC2F' : '#DD3500' }} />
            </Icon>
        </MeltaTooltip>
    );
};
