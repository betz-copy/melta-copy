import React, { CSSProperties } from 'react';

interface ImageWithDisableProps {
    srcPath: string;
    disabled?: boolean;
    style?: CSSProperties;
}

const ImageWithDisable: React.FC<ImageWithDisableProps> = ({ srcPath, disabled = false, style }) => {
    return <img src={srcPath} style={{ opacity: disabled ? '0.3' : '1', ...style }} />;
};

export { ImageWithDisable };
