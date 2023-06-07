import React, { CSSProperties } from 'react';
import { useSelector } from 'react-redux';
import { environment } from '../globals';
import { RootState } from '../store';

interface CustomImageProps {
    imageUrl: string;
    width: string;
    height: string;
    color?: CSSProperties['color'];
    style?: CSSProperties;
}

export const CustomImage: React.FC<CustomImageProps> = ({ imageUrl, width, height, color, style }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);

    return (
        <img
            height={height}
            width={width}
            style={{
                ...style,
                backgroundColor: color || (darkMode ? '#FFFFFF' : '#000000'),
                WebkitMaskImage: `url(${imageUrl})`,
                WebkitMaskSize: 'contain',
            }}
        />
    );
};

interface CustomIconProps {
    iconUrl: string;
    width: string;
    height: string;
    color?: CSSProperties['color'];
    style?: CSSProperties;
}

export const CustomIcon: React.FC<CustomIconProps> = ({ iconUrl, width, height, color, style }) => {
    return <CustomImage imageUrl={`/api${environment.api.storage}/${iconUrl}`} width={width} height={height} color={color} style={style} />;
};
