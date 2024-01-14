import React, { MouseEventHandler } from 'react';
import { IconButton, Grid } from '@mui/material';
import { CloseOutlined as DeleteIcon, FilePresent as FileIcon } from '@mui/icons-material';
import { Accept, useDropzone } from 'react-dropzone';
import i18next from 'i18next';
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
        <Grid container flexDirection="column" justifyContent="space-around" max-width="100%">
            <Grid item>
                <div style={{ color: '#9398C2' }}>{inputText}</div>
            </Grid>

            <Grid item>
                {fileName ? (
                    <div style={inputStyle} {...getRootProps()}>
                        <input {...getInputProps()} />
                        <FileIcon fontSize="medium" style={{ marginRight: '10px', marginLeft: '5px' }} />
                        <Grid container alignItems="center" justifyContent="space-between" width="95%" flexWrap="nowrap">
                            <Grid item style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', width: '90%' }}>
                                {fileName}
                            </Grid>
                            <Grid item>
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
                            </Grid>
                        </Grid>
                    </div>
                ) : (
                    <div style={inputStyle} {...getRootProps()}>
                        <input {...getInputProps()} placeholder="aa" />
                        <img src="\icons\Choose-File.svg" height="25px" width="120px" />
                        <p>|</p>
                        <img src="\icons\File-Drag-Icon.svg" height="25px" style={{ marginRight: '10px' }} />
                        <p style={{ marginRight: '30px' }}>{i18next.t('input.imagePicker.dragFile')}</p>
                    </div>
                )}
                {errorText && (
                    <p id="error" style={errorStyle}>
                        {errorText}
                    </p>
                )}
            </Grid>
        </Grid>
    );
};

export default FileInput;
