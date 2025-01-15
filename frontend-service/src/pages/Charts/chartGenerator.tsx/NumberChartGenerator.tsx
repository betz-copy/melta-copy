import { Box, Typography, useTheme } from '@mui/material';
import React from 'react';
import { IBasicChart } from '../../../interfaces/charts';

export const NumberChartGenerator: React.FC<{
    data:
        | {
              x: any;
              y: any;
          }[]
        | undefined;
    formikValues: IBasicChart;
}> = ({ data, formikValues }) => {
    const theme = useTheme();

    const darkMode = theme.palette.mode === 'dark';

    const { name, description } = formikValues;

    if (!data?.[0]?.x) return null;

    return (
        <Box
            sx={{
                bgcolor: darkMode ? '#131313' : '#fcfeff',
                minWidth: '500px',
                height: 400,
                borderRadius: '5%',
                p: 2,
                boxShadow: darkMode ? '0.5px #444' : '4px #0000000D',
                overflow: 'hidden',
                textAlign: 'center',
            }}
        >
            {name && (
                <Typography variant="h5" fontWeight="450" color={theme.palette.primary.main} sx={{ textAlign: 'center', mb: 1 }}>
                    {name}
                </Typography>
            )}

            {description && (
                <Typography variant="subtitle1" color={theme.palette.primary.main} sx={{ textAlign: 'center', mb: 2 }}>
                    {description}
                </Typography>
            )}

            <Typography
                fontSize="120px"
                fontWeight="500"
                color={theme.palette.primary.main}
                sx={{ textAlign: 'center', marginTop: 6, direction: 'rtl' }}
            >
                {data[0].x}
            </Typography>
        </Box>
    );
};
