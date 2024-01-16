import React, { MouseEventHandler } from 'react';
import { IconButton, Grid, useTheme, Typography } from '@mui/material';
import { CloseOutlined as DeleteIcon, FilePresent as FileIcon } from '@mui/icons-material';
import { Accept, useDropzone } from 'react-dropzone';
import i18next from 'i18next';

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
    const theme = useTheme();

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
        border: isDragActive ? `2px dashed ${theme.palette.primary.main}` : '1px solid rgb(196, 196, 196)',
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
        <Grid container flexDirection="column" justifyContent="space-around">
            <Grid item>
                <Typography style={{ color: '#9398C2' }}>{inputText}</Typography>
            </Grid>

            <Grid item container>
                {fileName ? (
                    <Grid item container style={inputStyle} {...getRootProps()}>
                        <input {...getInputProps()} />
                        <Grid container item flexDirection="row" alignItems="center" justifyContent="space-between" flexWrap="nowrap" width="100%">
                            <Grid item flexGrow="1">
                                <FileIcon fontSize="medium" />
                            </Grid>
                            <Grid item flexGrow="1">
                                <Typography style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{fileName}</Typography>
                            </Grid>
                            <Grid item flexGrow="1">
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
                    </Grid>
                ) : (
                    <Grid style={inputStyle} {...getRootProps()}>
                        <input {...getInputProps()} placeholder="aa" />
                        <img src="\icons\Choose-File.svg" height="25px" width="120px" />
                        <Typography>|</Typography>
                        <img src="\icons\File-Drag-Icon.svg" height="25px" style={{ marginRight: '10px' }} />
                        <Typography style={{ marginRight: '30px' }}>{i18next.t('input.imagePicker.dragFile')}</Typography>
                    </Grid>
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
