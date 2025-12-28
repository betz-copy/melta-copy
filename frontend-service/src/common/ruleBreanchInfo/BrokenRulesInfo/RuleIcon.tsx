import { Gavel as GavelIcon } from '@mui/icons-material';
import { Icon } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { environment } from '../../../globals';
import { ActionOnFail, IMongoRule } from '../../../interfaces/rules';
import MeltaTooltip from '../../MeltaDesigns/MeltaTooltip';

const { color } = environment;

interface RuleIconProps {
    ruleType: IMongoRule['actionOnFail'];
}

export const RuleIcon: React.FC<RuleIconProps> = ({ ruleType }) => {
    return (
        <MeltaTooltip
            title={
                ruleType === ActionOnFail.WARNING ? i18next.t(`ruleBreachInfo.${ruleType.toLowerCase()}`) : i18next.t('ruleBreachInfo.enforcement')
            }
        >
            <Icon>
                <GavelIcon style={{ color: color[ruleType.toLowerCase()] }} />
            </Icon>
        </MeltaTooltip>
    );
};
