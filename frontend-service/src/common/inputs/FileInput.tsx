import React, { useEffect, useRef, useState } from 'react';
import { IconButton, Grid, useTheme, Typography } from '@mui/material';
import { CloseOutlined as DeleteIcon } from '@mui/icons-material';
import { Accept, useDropzone } from 'react-dropzone';
import FileIcon from '../FilePreview/FileIcon';
import { getFileExtension } from '../../utils/getFileType';

interface FileInputProps {
    files: File[];
    onDropFiles?: (acceptedFiles: File[]) => void;
    onDropFile?: (acceptedFiles: File) => void;
    onDeleteFile: (fileIndex: number) => void;
    inputText: string;
    acceptedFilesTypes?: Accept;
    errorText?: string;
}

const FileInput: React.FC<FileInputProps> = ({ files, onDropFiles, onDropFile, onDeleteFile, inputText, acceptedFilesTypes, errorText }) => {
    const theme = useTheme();

    const errorStyle = {
        color: '#d32f2f',
        margin: 0,
        padding: 0,
    };
    console.log(files);
    const onDrop = (acceptedFiles: File[] | File) => {
        if (Array.isArray(acceptedFiles) && onDropFiles) {
            onDropFiles(acceptedFiles);
        } else if(onDropFile && !Array.isArray(acceptedFiles) ){
            onDropFile(acceptedFiles);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: acceptedFilesTypes,
        multiple: true, 
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
        height: 'auto',
        display: 'flex',
        padding: '10px',
        alignItems: 'center',
        cursor: 'pointer',
    };
    console.log(files); // for regular [{name: .....}], mine: [...., .....]

    return (
        <Grid container flexDirection="column" justifyContent="space-around" width="100%" ref={inputRef}>
            <Grid item>
                <Typography style={{ color: '#9398C2' }}>{inputText}</Typography>
            </Grid>

            <Grid item container style={inputStyle} {...getRootProps()}>
                <input {...getInputProps()} />
                <Grid item container alignItems="center" flexWrap="wrap">
                    {files?.map((file, index) => (
                        <Grid key={index} item container justifyContent="space-between" alignItems="center" width="100%">
                            <Grid item container xs={1} justifyContent="center" paddingTop="5px">
                                <Grid item>
                                    <FileIcon extension={getFileExtension(file.name)} style={{ height: '20px' }} />
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
                                    {file.name}
                                </Typography>
                            </Grid>
                            <Grid item container xs={1} justifyContent="flex-end">
                                <Grid item justifySelf="flex-end">
                                    <IconButton onClick={() => onDeleteFile(index)} size="small">
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        </Grid>
                    ))}
                </Grid>
            </Grid>
            {errorText && (
                <p id="error" style={errorStyle}>
                    {errorText}
                </p>
            )}
        </Grid>
    );
};

export default FileInput;
