import React, { CSSProperties, ElementType } from 'react';
import { Typography, TypographyTypeMap, useTheme } from '@mui/material';

interface BlueTitleProps {
    title: string;
    component: ElementType;
    variant: TypographyTypeMap['props']['variant'];
    style?: CSSProperties;
}

const BlueTitle: React.FC<BlueTitleProps> = ({ title, component, variant, style }) => {
    const theme = useTheme();

    return (
        <Typography
            style={{
                color: theme.palette.primary.main,
                fontWeight: '700',
                ...style,
            }}
            component={component}
            variant={variant}
        >
            {title}
        </Typography>
    );
};

export default BlueTitle;
