import { TextField, TextFieldProps } from '@mui/material';
import React from 'react';

type ViewModeTextFieldProps = TextFieldProps & {
    readOnly?: boolean;
};

const ViewModeTextField: React.FC<ViewModeTextFieldProps> = ({ readOnly = false, InputProps, value, ...rest }) => {
    return (
        <TextField
            {...rest}
            value={value ?? (readOnly ? '-' : '')}
            variant={readOnly ? 'standard' : 'outlined'}
            InputProps={{
                ...InputProps,
                readOnly,
                ...(readOnly && { disableUnderline: true }),
                style: {
                    textOverflow: 'ellipsis',
                    ...(InputProps?.style || {}),
                },
            }}
        />
    );
};

export { ViewModeTextField };
