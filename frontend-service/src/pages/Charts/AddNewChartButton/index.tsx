import { Add as AddIcon } from '@mui/icons-material';
import { Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useLocation } from 'wouter';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';

const AddNewChartButton: React.FC = () => {
    const theme = useTheme();

    const [currentLocation, navigate] = useLocation();

    return (
        <IconButtonWithPopover
            popoverText={i18next.t('charts.actions.addChart')}
            iconButtonProps={{
                onClick: () => navigate(`${currentLocation}/chart`, { state: { isDashboardPage: false } }),
            }}
            style={{ background: theme.palette.primary.main, borderRadius: '7px', width: '150px', height: '35px' }}
        >
            <AddIcon htmlColor="white" />
            <Typography fontSize={13} style={{ fontWeight: '400', padding: '0 5px', color: 'white' }}>
                {i18next.t('charts.actions.addChart')}
            </Typography>
        </IconButtonWithPopover>
    );
};

export { AddNewChartButton };
