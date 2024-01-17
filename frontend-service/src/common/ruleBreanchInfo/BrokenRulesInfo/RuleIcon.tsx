import React from 'react';
import { Gavel as GavelIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { Icon, Tooltip } from '@mui/material';
import { IMongoRule } from '../../../interfaces/rules';

interface RuleIconProps {
    ruleType: IMongoRule['actionOnFail'];
}

export const RuleIcon: React.FC<RuleIconProps> = ({ ruleType }) => {
    return (
        <Tooltip
            title={String(ruleType === 'WARNING' ? i18next.t('ruleBreachInfo.warning') : i18next.t('ruleBreachInfo.enforcement'))}
            PopperProps={{
                sx: { '& .MuiTooltip-tooltip': { fontSize: '0.8rem' } },
            }}
        >
            <Icon>
                <GavelIcon style={{ color: ruleType === 'WARNING' ? '#FFAC2F' : '#DD3500' }} />;
            </Icon>
        </Tooltip>
    );
};
