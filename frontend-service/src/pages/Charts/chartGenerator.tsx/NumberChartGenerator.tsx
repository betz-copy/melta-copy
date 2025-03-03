import { Box, Typography, useTheme } from '@mui/material';
import React from 'react';

export const NumberChartGenerator: React.FC<{
    data:
        | {
              x: any;
              y: any;
          }[]
        | undefined;
    name: string;
    description: string;
    enableResize?: boolean;
}> = ({ data, name, description, enableResize = false }) => {
    const theme = useTheme();

    const darkMode = theme.palette.mode === 'dark';

    if (data?.[0]?.x === undefined || data?.[0]?.x === null) return null;

    return (
        <Box
            sx={{
                bgcolor: darkMode ? '#131313' : '#fcfeff',
                minWidth: enableResize ? undefined : '500px',
                height: enableResize ? '100%' : 400,
                borderRadius: enableResize ? undefined : '5%',
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
