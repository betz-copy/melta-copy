import { Autocomplete, Grid, MenuItem, TextField, TextFieldProps, Typography } from '@mui/material';
import React from 'react';
import { ExpandMore, Close } from '@mui/icons-material';
import { ColoredEnumChip } from '../ColoredEnumChip';
import { MeltaCheckbox } from '../MeltaCheckbox';
import { MeltaTooltip } from '../MeltaTooltip';
import { HighlightText } from '../../utils/HighlightText';

const MultipleSelect: React.FC<{
    items: {
        label: string;
        value: string;
        color?: string;
    }[];
    id: string;
    disabled?: boolean;
    readonly?: boolean;
    multiple?: boolean;
    selectedValue:
        | {
              label: string;
              value: string;
              color?: string;
          }
        | {
              label: string;
              value: string;
              color?: string;
          }[]
        | null;
    onChange: (event, newVal) => void;
    textFieldProps: any;
    required?: boolean;
    autofocus?: boolean;
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
    onFocus: (event: React.FocusEvent<HTMLInputElement>) => void;
    variant: 'standard' | 'outlined';
    rawErrors: string[];
    label?: string;
    color?: string;
    value: any;
}> = ({
    items,
    id,
    disabled,
    readonly,
    multiple,
    selectedValue,
    onChange,
    textFieldProps,
    required,
    autofocus,
    onBlur,
    onFocus,
    variant,
    rawErrors,
    label,
    color,
    value,
}) => {
    return (
        <Autocomplete<(typeof items)[number], boolean>
            id={id}
            disabled={disabled}
            readOnly={readonly}
            multiple={multiple}
            disableCloseOnSelect={multiple}
            value={selectedValue}
            options={items}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, val) => option.value === val.value}
            onChange={onChange}
            popupIcon={<ExpandMore />}
            renderOption={(props, option) => {
                return (
                    <MenuItem {...props} key={option.value} value={option.value} style={{ height: '40px' }}>
                        {multiple && <MeltaCheckbox checked={value.includes(option.value)} />}
                        <ColoredEnumChip {...props} label={option.label} color={option.color || 'default'} />
                    </MenuItem>
                );
            }}
            renderTags={(tagValue, getTagProps) => {
                const maxVisible = 6;
                const visibleTags = tagValue.slice(0, maxVisible);
                const hiddenTags = tagValue.slice(maxVisible);

                return [
                    ...visibleTags.map((option, index) => {
                        const { key, onDelete, ...restTagProps } = getTagProps({ index });
                        return (
                            <Grid alignContent="center" justifyContent="center" key={key}>
                                <ColoredEnumChip
                                    label={option.label}
                                    color={option.color || 'default'}
                                    onDelete={onDelete}
                                    deleteIcon={<Close />}
                                    {...restTagProps}
                                    style={{ margin: '2px 4px 2px 0' }}
                                />
                            </Grid>
                        );
                    }),
                    ...(hiddenTags.length > 0
                        ? [
                              <Grid item style={{ cursor: 'pointer' }} key="more">
                                  <MeltaTooltip
                                      title={hiddenTags.map((item) => (
                                          <Typography key={item.value} style={{ margin: '5px' }}>
                                              <HighlightText text={item.label} />
                                          </Typography>
                                      ))}
                                      arrow
                                  >
                                      <Grid
                                          container
                                          alignItems="center"
                                          justifyContent="center"
                                          sx={{ borderRadius: '30px', height: '24px', width: '24px', background: 'var(--Gray-Medium, #9398C2)' }}
                                      >
                                          <Typography color="white" fontWeight={500} fontSize="12px">
                                              +{hiddenTags.length}
                                          </Typography>
                                      </Grid>
                                  </MeltaTooltip>
                              </Grid>,
                          ]
                        : []),
                ];
            }}
            renderInput={(params) => {
                const isMultiple = selectedValue && !Array.isArray(selectedValue);
                return (
                    <TextField
                        {...textFieldProps}
                        {...params}
                        required={required}
                        autoFocus={autofocus}
                        onBlur={onBlur}
                        onFocus={onFocus}
                        variant={variant}
                        error={rawErrors.length > 0}
                        label={label}
                        InputProps={{
                            ...params.InputProps,
                            startAdornment: isMultiple ? (
                                <ColoredEnumChip label={selectedValue.label} color={selectedValue.color || 'default'} style={{ marginLeft: 1 }} />
                            ) : (
                                params.InputProps.startAdornment
                            ),
                            inputProps: {
                                ...params.inputProps,
                                style: isMultiple ? { display: 'none' } : {},
                            },
                        }}
                        color={color as TextFieldProps['color']}
                        InputLabelProps={{ shrink: readonly || undefined }}
                    />
                );
            }}
        />
    );
};

export default MultipleSelect;
