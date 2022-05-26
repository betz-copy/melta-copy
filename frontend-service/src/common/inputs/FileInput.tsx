import React, { MouseEventHandler } from 'react';
import { IconButton, Grid } from '@mui/material';
import { CloseOutlined as DeleteIcon, FilePresent as FileIcon } from '@mui/icons-material';

const FileInput: React.FC<{
    filePath: string | undefined;
    onDeleteFile: MouseEventHandler;
    onDropFile: (acceptedFile: File) => void;
    inputText: string;
    acceptedFilesTypes?: string;
    name: string;
    errorText?: string;
}> = ({ filePath, acceptedFilesTypes, inputText, name, onDeleteFile, onDropFile, errorText }) => {
    const inputStyle = {
        border: '1px solid rgb(196 196 196)',
        borderRadius: '5px',
        width: '220px',
        height: '56px',
        display: 'flex',
        padding: '16px 10px',
        color: '#666666',
    };

    const errorStyle = {
        color: 'rgb(211, 47, 47)',
        margin: 0,
        padding: 0,
    };

    if (filePath) {
        return (
            <>
                <div style={inputStyle}>
                    <FileIcon fontSize="medium" style={{ marginRight: '10px', marginLeft: '5px' }} />
                    <Grid item style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', width: '145px' }}>
                        {filePath}
                    </Grid>
                    <IconButton
                        onClick={(e) => {
                            e.preventDefault();
                            onDeleteFile(e);
                        }}
                        size="small"
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </div>
                {errorText && (
                    <p id="error" style={errorStyle}>
                        {errorText}
                    </p>
                )}
            </>
        );
    }

    return (
        <>
            <label htmlFor={name} style={inputStyle}>
                <input
                    id={name}
                    name={name}
                    type="file"
                    accept={acceptedFilesTypes}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        if (e.target.files) {
                            onDropFile(e.target.files[0]);
                        }
                    }}
                />
                {inputText}
            </label>
            {errorText && (
                <p id="error" style={errorStyle}>
                    {errorText}
                </p>
            )}
        </>
    );
};

export default FileInput;
