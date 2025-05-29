/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
import React from 'react';
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
    const _onChange = ({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) => {
        onChange(checked);
    };

    return (
        <Box display="flex" alignItems="center">
            <MeltaCheckbox {...textFieldProps} disabled={disabled} onChange={_onChange} checked={Boolean(value)} />
            <Typography>{label}</Typography>
        </Box>
    );
};

export default RjsfCheckboxWidget;
