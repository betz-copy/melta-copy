import React, { CSSProperties } from 'react';
import { useSelector } from 'react-redux';
import { environment } from '../globals';
import { RootState } from '../store';

interface CustomIconProps {
    iconUrl: string;
    width: string;
    height: string;
    color?: CSSProperties['color'];
    style?: CSSProperties;
}

const CustomIcon: React.FC<CustomIconProps> = ({ iconUrl, width, height, color, style }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);

    return (
        <img
            height={height}
            width={width}
            style={{
                ...style,
                backgroundColor: color || (darkMode ? '#FFFFFF' : '#000000'),
                WebkitMaskImage: `url(/api${environment.api.storage}/${iconUrl})`,
                WebkitMaskSize: 'contain',
            }}
        />
    );
};

export { CustomIcon };
