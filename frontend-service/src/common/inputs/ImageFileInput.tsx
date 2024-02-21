import React, { MouseEventHandler, useEffect, useRef, useState } from 'react';
import { IconButton, Grid, useTheme, Typography } from '@mui/material';
import { CloseOutlined as DeleteIcon } from '@mui/icons-material';
import { Accept, useDropzone } from 'react-dropzone';
import i18next from 'i18next';
import FileIcon from '../FilePreview/FileIcon';
import { getFileExtension } from '../../utils/getFileType';

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
        color: '#d32f2f',
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

    const [inputWidth, setInputWidth] = useState<number>(200);
    const inputRef = useRef<HTMLDivElement>(null);

    const updateInputWidth = () => {
        if (inputRef.current) {
            setInputWidth(inputRef.current.offsetWidth);
        }
    };

    useEffect(() => {
        updateInputWidth();
        window.addEventListener('resize', updateInputWidth);
        return () => {
            window.removeEventListener('resize', updateInputWidth);
        };
    }, []);

    const inputStyle = {
        border: isDragActive ? `2px dashed ${theme.palette.primary.main}` : '1px solid #c4c4c4',
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
        <Grid container flexDirection="column" justifyContent="space-around" width="100%" ref={inputRef}>
            <Grid item>
                <Typography style={{ color: '#9398C2' }}>{inputText}</Typography>
            </Grid>

            <Grid item container>
                {fileName ? (
                    <Grid item container style={inputStyle} {...getRootProps()}>
                        <input {...getInputProps()} />
                        <Grid container item flexDirection="row" alignItems="center" flexWrap="nowrap">
                            <Grid item container xs={1} justifyContent="center" paddingTop="5px">
                                <Grid item>
                                    <FileIcon extension={getFileExtension(fileName)} style={{ height: '20px' }} />
                                </Grid>
                            </Grid>
                            <Grid item xs={10}>
                                <Typography
                                    style={{
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap',
                                        textOverflow: 'ellipsis',
                                        maxWidth: inputWidth * 0.7,
                                    }}
                                >
                                    {fileName}
                                </Typography>
                            </Grid>
                            <Grid item container xs={1} justifyContent="flex-end">
                                <Grid item justifySelf="flex-end">
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
                    </Grid>
                ) : (
                    <Grid style={inputStyle} {...getRootProps()}>
                        <input {...getInputProps()} placeholder="aa" />
                        <img src="\icons\Choose-File.svg" height="25px" width="120px" />
                        <Typography>|</Typography>
                        <img src="\icons\File-Drag-Icon.svg" height="25px" style={{ marginRight: '10px' }} />
                        <Typography
                            style={{
                                marginRight: '30px',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                maxWidth: inputWidth * 0.7 - 150,
                            }}
                        >
                            {i18next.t('input.imagePicker.dragFile')}
                        </Typography>
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