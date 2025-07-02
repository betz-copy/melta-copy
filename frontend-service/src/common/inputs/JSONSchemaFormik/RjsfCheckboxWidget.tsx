import React, { useEffect } from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Box, Typography } from '@mui/material';
import { MeltaCheckbox } from '../../MeltaCheckbox';

const RjsfCheckboxWidget = ({
    id,
    placeholder,
    required,
    readonly,
    disabled,
    type,
    label,
    value,
    onChange,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
    uiSchema,
    rawErrors = [],
    formContext,
    registry,
    color,
    propertyReadOnly,
    ...textFieldProps
}: WidgetProps) => {
    const { defaultValue } = options;

    useEffect(() => {
        if (!value && !!defaultValue) {
            onChange(defaultValue);
        }
    }, [value, defaultValue, onChange]);

    const _onChange = ({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) => {
        onChange(checked);
    };

    return (
        <Box display="flex" alignItems="center">
            <MeltaCheckbox {...textFieldProps} disabled={disabled} onChange={_onChange} checked={Boolean(value)} />
            <Typography sx={{ color: '#9398C2' }}>{label}</Typography>
        </Box>
    );
};

export default RjsfCheckboxWidget;
