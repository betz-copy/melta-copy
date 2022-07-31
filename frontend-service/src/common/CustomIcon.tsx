import React, { CSSProperties } from 'react';
import { environment } from '../globals';

interface CustomIconProps {
    iconUrl: string;
    width: string;
    height: string;
    color?: CSSProperties['color'];
    style?: CSSProperties;
}

const CustomIcon: React.FC<CustomIconProps> = ({ iconUrl, width, height, color = '#000000', style }) => {
    return (
        <img
            height={height}
            width={width}
            style={{
                ...style,
                backgroundColor: color,
                WebkitMaskImage: `url(/api${environment.api.storage}/${iconUrl})`,
                WebkitMaskSize: 'contain',
            }}
        />
    );
};

export { CustomIcon };
