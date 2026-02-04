import { Box, Typography } from '@mui/material';
import { WidgetProps } from '@rjsf/utils';
import i18next from 'i18next';
import React from 'react';
import MeltaCheckbox from '../../../MeltaDesigns/MeltaCheckbox';
import { CleanViewRow, isCleanView } from './CleanView';

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

    if (isCleanView(readonly, formContext)) {
        return (
            <CleanViewRow
                label={label || schema.title}
                value={value ? i18next.t('booleanOptions.yes', { defaultValue: 'Yes' }) : i18next.t('booleanOptions.no', { defaultValue: 'No' })}
            />
        );
    }

    return (
        <Box display="flex" alignItems="center">
            <MeltaCheckbox {...textFieldProps} disabled={disabled || readonly} onChange={_onChange} checked={!!value} />
            <Typography sx={{ color: '#9398C2' }}>{label}</Typography>
        </Box>
    );
};

export default RjsfCheckboxWidget;
