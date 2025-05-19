import React, { CSSProperties } from 'react';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';

interface ImageWithDisableProps {
    srcPath: string;
    disabled?: boolean;
    style?: CSSProperties;
}

const ImageWithDisable: React.FC<ImageWithDisableProps> = ({ disabled = false, style }) => {
    return <ContentCopyOutlinedIcon style={{ opacity: disabled ? '0.3' : '1', ...style }} />;
};

export { ImageWithDisable };
