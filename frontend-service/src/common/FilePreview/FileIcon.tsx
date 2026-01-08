import { FilePresent } from '@mui/icons-material';
import React, { CSSProperties } from 'react';

interface FileIconProps {
    extension: string;
    style?: CSSProperties;
}

const FileIcon: React.FC<FileIconProps> = ({ extension, style }) => {
    switch (extension.toLowerCase()) {
        case 'docx':
        case 'doc':
            return <img src="/icons/files/docx.svg" style={style} alt="DOCX/DOC Icon" />;
        case 'pdf':
            return <img src="/icons/files/pdf.svg" style={style} alt="PDF Icon" />;
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
            return <img src="/icons/files/image.svg" style={style} alt="graphic file" />;
        case 'mp4':
        case 'avi':
        case 'mov':
        case 'wmv':
            return <img src="/icons/files/video.svg" style={style} alt="Video Icon" />;
        case 'pptx':
        case 'ppt':
            return <img src="/icons/files/pptx.svg" style={style} alt="PPTX/PPT Icon" />;
        case 'xlsx':
        case 'xls':
            return <img src="/icons/files/xlsx.svg" style={style} alt="XLSX/XLS Icon" />;
        case 'zip':
        case 'rar':
        case '7z':
            return <img src="/icons/files/zip.svg" style={style} alt="Archive Icon" />;
        default:
            return <FilePresent style={style} />;
    }
};

export default FileIcon;
