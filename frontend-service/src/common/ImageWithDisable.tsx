import React, { CSSProperties } from 'react';

interface ImageWithDisableProps {
    srcPath: string;
    disabled?: boolean;
    style?: CSSProperties;
    alt?: string;
}

const ImageWithDisable: React.FC<ImageWithDisableProps> = ({ srcPath, disabled = false, style, alt = '' }) => {
    return <img src={srcPath} style={{ opacity: disabled ? '0.3' : '1', ...style }} alt={alt} />;
};

export { ImageWithDisable };
