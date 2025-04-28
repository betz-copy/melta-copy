import { Grid } from '@mui/material';
import React, { CSSProperties } from 'react';

interface EntityTemplateColorProps {
    entityTemplateColor: string;
    style?: CSSProperties;
}

const EntityTemplateColor: React.FC<EntityTemplateColorProps> = ({ entityTemplateColor, style }) => {
    return (
        <Grid
            style={{
                height: '20px',
                width: '3px',
                backgroundColor: entityTemplateColor,
                borderRadius: '20px',
                ...style,
            }}
        />
    );
};

export { EntityTemplateColor };
