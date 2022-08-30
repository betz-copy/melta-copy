import React, { CSSProperties, ElementType } from 'react';
import { Typography, TypographyTypeMap } from '@mui/material';

const BlueTitle: React.FC<{ title: string; component: ElementType; variant: TypographyTypeMap['props']['variant']; style?: CSSProperties }> = ({
    title,
    component,
    variant,
    style,
}) => {
    return (
        <Typography
            style={{
                color: '#225AA7',
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
