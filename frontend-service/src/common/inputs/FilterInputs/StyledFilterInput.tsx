import { styled, TextField, TextFieldProps } from '@mui/material';
import React from 'react';

type ReadOnlyTextFieldProps = TextFieldProps & {
    readOnly?: boolean;
};

const ReadOnlyTextField: React.FC<ReadOnlyTextFieldProps> = ({ readOnly = false, InputProps, value, ...rest }) => {
    return (
        <TextField
            {...rest}
            value={value || (readOnly ? '-' : '')}
            variant={readOnly ? 'standard' : 'outlined'}
            InputProps={{
                ...InputProps,
                readOnly: readOnly,
                disableUnderline: true,
                style: {
                    textOverflow: 'ellipsis',
                    ...(InputProps?.style || {}),
                },
            }}
        />
    );
};

export const StyledFilterInput = styled(ReadOnlyTextField)(({ theme }) => ({
    '& .MuiInputBase-root': {
        borderRadius: '7px',
        backgroundColor: theme.palette.mode === 'dark' ? undefined : 'white',
    },
    '& .MuiInputBase-input': {
        color: theme.palette.mode === 'dark' ? undefined : ' rgba(83, 86, 110, 1)',
        fontSize: '14px',
        fontWeight: '400',
    },
    '& fieldset': {
        borderColor: '#CCCFE5',
        color: '#CCCFE5',
    },
    '& label': {
        color: '#9398C2',
    },
}));
export { ReadOnlyTextField };
