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
                width: '100%',
                maxWidth: 540,
                height: 400,
                borderRadius: 1.5,
                p: 2,
                boxShadow: darkMode ? '0.5px #444' : '4px #0000000D',
                overflow: 'hidden',
                textAlign: 'center',
            }}
        >
            {name && (
                <Typography variant="h6" color={theme.palette.primary.main} sx={{ textAlign: 'center', mb: 1 }}>
                    {name}
                </Typography>
            )}

            {description && (
                <Typography variant="subtitle1" color={theme.palette.primary.main} sx={{ textAlign: 'center', mb: 2 }}>
                    {description}
                </Typography>
            )}

            <Typography fontSize="100px" color={theme.palette.primary.main} sx={{ textAlign: 'center', marginTop: 4 }}>
                {data[0].x}
            </Typography>
        </Box>
    );
};
