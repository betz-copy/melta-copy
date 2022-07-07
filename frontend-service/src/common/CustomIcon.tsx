import React, { CSSProperties, useMemo } from 'react';
import { environment } from '../globals';
import { hexToColorFilter } from '../utils/hexToColorFilter';

interface CustomIconProps {
    iconUrl: string;
    width: string;
    height: string;
    hexColor?: string;
    style?: CSSProperties;
}

const CustomIcon: React.FC<CustomIconProps> = ({ iconUrl, width, height, hexColor = '#000000', style }) => {
    const colorFilter = useMemo(() => hexToColorFilter(hexColor), [hexColor]);

    return (
        <img
            src={`/api${environment.api.storage}/${iconUrl}`}
            height={height}
            width={width}
            style={{
                ...style,
                filter: colorFilter,
            }}
        />
    );
};

export { CustomIcon };
