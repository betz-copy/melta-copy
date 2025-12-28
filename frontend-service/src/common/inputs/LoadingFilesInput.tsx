import { CloseOutlined as DeleteIcon } from '@mui/icons-material';
import { Grid, IconButton, LinearProgress, Typography } from '@mui/material';
import React from 'react';
import { getFileName } from '../../utils/getFileName';

export const LoadingFilesInput: React.FC<{
    files: Partial<File>[] | { name: string }[];
    errorText?: string;
    setErrorText?: React.Dispatch<React.SetStateAction<string | undefined>>;
    inputWidth: number;
    isFileFromInput: boolean;
}> = ({ files, errorText, setErrorText, inputWidth, isFileFromInput }) => {
    const loadingStyle = {
        border: '1px solid #c4c4c4',
        borderRadius: '10px',
        borderColor: errorText ? 'error' : '#CCCFE5',
        color: '#9398C2',
        width: '100%',
        display: 'flex',
        padding: '5px 20px',
        cursor: 'pointer',
    };

    return (
        <Grid container style={loadingStyle} direction="column">
            <Grid container alignItems="center" wrap="nowrap">
                <Grid size={{ xs: 10 }}>
                    <Typography
                        style={{
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            maxWidth: inputWidth * 0.7,
                            color: errorText ? 'error' : '',
                        }}
                    >
                        {errorText ?? files.map((file) => (isFileFromInput ? file.name : getFileName(file.name!))).join(', ')}
                    </Typography>
                </Grid>
                <Grid container justifyContent="flex-end" alignItems="center" wrap="nowrap">
                    <IconButton
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setErrorText?.(undefined);
                        }}
                        size="small"
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Grid>
            </Grid>

            <Grid display="flex" justifyContent="center">
                <LinearProgress
                    style={{
                        width: '100%',
                        backgroundColor: errorText ? 'error' : '#E1F5FE',
                        borderRadius: '25px',
                        margin: '5px',
                    }}
                    sx={{
                        '& .MuiLinearProgress-bar': {
                            backgroundColor: errorText ? 'error' : '#4752B6',
                        },
                    }}
                    variant={errorText ? 'determinate' : 'indeterminate'}
                    value={errorText ? 100 : undefined}
                />
            </Grid>
        </Grid>
    );
};
