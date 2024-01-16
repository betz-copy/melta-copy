import React from 'react';
import { Gavel as GavelIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { Icon, Tooltip } from '@mui/material';
import { IMongoRule } from '../../../interfaces/rules';
import { MeltaTooltip } from '../../MeltaTooltip';

interface RuleIconProps {
    ruleType: IMongoRule['actionOnFail'];
}

export const RuleIcon: React.FC<RuleIconProps> = ({ ruleType }) => {
    return (
        <MeltaTooltip title={String(ruleType === 'WARNING' ? i18next.t('ruleBreachInfo.warning') : i18next.t('ruleBreachInfo.enforcement'))}>
            <Icon>
                <GavelIcon color={ruleType === 'WARNING' ? 'warning' : 'error'} />;
            </Icon>
        </MeltaTooltip>
    );
};
