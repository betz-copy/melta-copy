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
            value={value}
            variant={readOnly && !forceOutlined ? 'standard' : 'outlined'}
            slotProps={{
                ...rest.slotProps,
                input: {
                    ...InputProps,
                    readOnly,
                    ...(readOnly && { disableUnderline: true }),
                    style: {
                        textOverflow: 'ellipsis',
                        ...(InputProps?.style || {}),
                    },
                },
            }}
        />
    );
};

export { ViewModeTextField };