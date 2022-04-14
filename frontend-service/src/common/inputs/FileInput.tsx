import React, { MouseEventHandler, useState } from 'react';
import { IconButton, Grid } from '@mui/material';
import Dropzone from 'react-dropzone';
import { CloseOutlined as DeleteIcon, FilePresent as FileIcon } from '@mui/icons-material';

const FileInput: React.FC<{
    filePath: string | undefined;
    onDeleteFile: MouseEventHandler;
    onDropFile: (acceptedFiles: File[]) => void;
    multipleFiles: boolean;
    inputText: string;
    acceptedFilesTypes?: string | string[];
}> = ({ filePath, acceptedFilesTypes, multipleFiles, inputText, onDeleteFile, onDropFile }) => {
    const [border, setBorder] = useState('1px solid rgb(196 196 196)');

    if (filePath) {
        return (
            <Grid
                container
                style={{
                    border,
                    borderRadius: '5px',
                    paddingTop: '11px',
                    paddingBottom: '11px',
                    width: '220px',
                    alignItems: 'center',
                }}
            >
                <Grid item>
                    <FileIcon fontSize="medium" style={{ marginRight: '10px', marginLeft: '5px' }} />
                </Grid>
                <Grid item style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', width: '140px' }}>
                    {filePath}
                </Grid>
                <Grid item>
                    <IconButton onClick={onDeleteFile} size="small">
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Grid>
            </Grid>
        );
    }

    return (
        <Dropzone
            multiple={multipleFiles}
            disabled={!!filePath}
            accept={acceptedFilesTypes}
            onDrop={onDropFile}
            onDragEnter={() => {
                setBorder('1px dashed rgb(196 196 196');
            }}
            onDragLeave={() => {
                setBorder('1px solid rgb(196 196 196)');
            }}
        >
            {({ getRootProps, getInputProps }) => (
                <Grid style={{ border, borderRadius: '5px' }}>
                    <Grid {...getRootProps()}>
                        <input {...getInputProps()} name="iconFile" />
                        <p style={{ color: '#666666', paddingRight: '10px', width: '220px' }}>{inputText}</p>
                    </Grid>
                </Grid>
            )}
        </Dropzone>
    );
};

export default FileInput;
