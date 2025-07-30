import { TextField, TextFieldProps } from '@mui/material';
import React from 'react';

type ViewModeTextFieldProps = TextFieldProps & {
    readOnly?: boolean;
    forceOutlined?: boolean;
};

const ViewModeTextField: React.FC<ViewModeTextFieldProps> = ({ readOnly = false, forceOutlined = false, InputProps, value, ...rest }) => {
    return (
        <TextField
            {...rest}
            value={(value === '' || value == null) && readOnly ? '-' : value ?? ''}
            variant={readOnly && !forceOutlined ? 'standard' : 'outlined'}
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
