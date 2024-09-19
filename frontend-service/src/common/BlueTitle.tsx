import React, { CSSProperties, ElementType } from 'react';
import { Typography, TypographyTypeMap } from '@mui/material';
import { useDarkModeStore } from '../stores/darkMode';

interface BlueTitleProps {
    title: string;
    component: ElementType;
    variant: TypographyTypeMap['props']['variant'];
    style?: CSSProperties;
    toPrint?: boolean;
}

const BlueTitle: React.FC<BlueTitleProps> = ({ title, component, variant, style, toPrint }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <Typography
            style={{
                color: !toPrint && darkMode ? '#FFF' : '#1E2775',
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

export { BlueTitle };
