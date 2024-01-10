import React, { MouseEventHandler } from 'react';
import { IconButton, Grid } from '@mui/material';
import { CloseOutlined as DeleteIcon, FilePresent as FileIcon } from '@mui/icons-material';
import { Accept, useDropzone } from 'react-dropzone';
import { lightTheme } from '../../theme';

interface FileInputProps {
    fileName: string | undefined;
    onDeleteFile: MouseEventHandler;
    onDropFile: (acceptedFile: File) => void;
    inputText: string;
    acceptedFilesTypes?: Accept;
    fileFieldName?: string;
    errorText?: string;
}

const FileInput: React.FC<FileInputProps> = ({ fileName, onDeleteFile, onDropFile, inputText, acceptedFilesTypes, errorText }) => {
    const errorStyle = {
        color: 'rgb(211, 47, 47)',
        margin: 0,
        padding: 0,
    };

    const onDrop = (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file.type) {
            onDropFile(file);
        }
    };
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: acceptedFilesTypes,
    });

    const inputStyle = {
        border: isDragActive ? `2px dashed ${lightTheme.palette.primary.main}` : '1px solid rgb(196, 196, 196)',
        borderRadius: '10px',
        borderColor: '#CCCFE5',
        color: '#9398C2',
        width: '100%',
        height: '40px',
        display: 'flex',
        padding: '0px 10px',
        alignItems: 'center',
        cursor: 'pointer',
    };

    return (
        <>
            {fileName ? (
                <div style={inputStyle} {...getRootProps()}>
                    <input {...getInputProps()} />
                    <FileIcon fontSize="medium" style={{ marginRight: '10px', marginLeft: '5px' }} />
                    <Grid item style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', width: '145px' }}>
                        {fileName}
                    </Grid>
                    <IconButton
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDeleteFile(e);
                        }}
                        size="small"
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </div>
            ) : (
                <div style={inputStyle} {...getRootProps()}>
                    <input {...getInputProps()} />
                    {inputText}
                </div>
            )}
            {errorText && (
                <p id="error" style={errorStyle}>
                    {errorText}
                </p>
            )}
        </>
    );
};

export default FileInput;
