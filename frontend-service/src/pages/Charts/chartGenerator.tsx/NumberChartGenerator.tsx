import { Box, Typography, useTheme } from '@mui/material';
import { GeneratorChart } from '@packages/chart';
import React from 'react';
import { ChartForm } from '../../../interfaces/dashboard';
import { CardTitle } from '../../Dashboard/dashboardPage/TableCard';

export const NumberChartGenerator: React.FC<{
    data: GeneratorChart | undefined;
    chartDetails: Omit<ChartForm, 'filter'>;
    enableResize?: boolean;
}> = ({ data, chartDetails: { name, description }, enableResize = false }) => {
    const theme = useTheme();

    const darkMode = theme.palette.mode === 'dark';

    if (!data?.[0]?.x && data?.[0]?.x !== 0) return null;

    return (
        <Box
            sx={{
                bgcolor: darkMode ? '#131313' : '#fcfeff',
                width: enableResize ? '100%' : '75%',
                height: enableResize ? '100%' : '50%',
                borderRadius: enableResize ? undefined : '15px',
                p: 2,
                boxShadow: darkMode ? '0.5px #444' : '4px #0000000D',
                overflow: 'hidden',
                textAlign: 'center',
            }}
        >
            <CardTitle title={name} description={description} />

            <Typography fontSize="120px" fontWeight="500" color={theme.palette.primary.main} sx={{ textAlign: 'center', direction: 'rtl' }}>
                {data[0].x}
            </Typography>
        </Box>
    );
};
