import React, { CSSProperties, ElementType } from 'react';
import { Typography, TypographyTypeMap } from '@mui/material';
import { lightTheme } from '../theme';

interface BlueTitleProps {
    title: string;
    component: ElementType;
    variant: TypographyTypeMap['props']['variant'];
    style?: CSSProperties;
}

const BlueTitle: React.FC<BlueTitleProps> = ({ title, component, variant, style }) => {
    return (
        <Typography
            style={{
                color: lightTheme.palette.primary.main,
                fontWeight: '800',
                ...style,
            }}
            component={component}
            variant={variant}
        >
            {title}
        </Typography>
    );
};

export { BlueTitle };
