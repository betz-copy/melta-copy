/* eslint-disable no-nested-ternary */
import { Close } from '@mui/icons-material';
import { Autocomplete, Box, FormControl, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { ColoredEnumChip } from '../ColoredEnumChip';
import MeltaCheckbox from '../MeltaDesigns/MeltaCheckbox';

export interface Option {
    value: string;
    label: string;
}

interface SelectAutocompleteProps {
    options: Option[];
    value?: Option | Option[];
    onValueChange: (newValue: string | string[] | null | undefined) => void;
    multiple?: boolean;
    colorsOptions?: Record<string, string>;
    overrideSx?: object;
    disableClearable?: boolean;
    label?: string;
}

const SelectAutocomplete: React.FC<SelectAutocompleteProps> = ({
    options,
    value,
    onValueChange,
    multiple = false,
    colorsOptions,
    overrideSx,
    disableClearable,
    label,
}) => {
    const [selectedValues, setSelectedValues] = useState<Option | Option[] | undefined>(value || (multiple ? [] : undefined));

    useEffect(() => {
        setSelectedValues(value || (multiple ? [] : undefined));
    }, [value, multiple]);

    const handleAutocompleteChange = (newValue: Option | Option[] | null) => {
        const updatedValue = newValue === null ? (multiple ? [] : undefined) : newValue;
        setSelectedValues(updatedValue);
        onValueChange(Array.isArray(updatedValue) ? updatedValue.map((val) => val.value) : updatedValue?.value);
    };

    return (
        <FormControl fullWidth={!disableClearable}>
            <Autocomplete<Option, boolean, boolean, false>
                multiple={multiple}
                value={selectedValues}
                onChange={(_, newValue) => handleAutocompleteChange(newValue)}
                disableCloseOnSelect={multiple}
                options={options}
                getOptionLabel={(option) => option.label}
                style={overrideSx}
                fullWidth
                isOptionEqualToValue={(option, val) => option.value === val.value}
                renderOption={(props, option) => (
                    <Box component="li" {...props} key={option.value} style={{ height: '40px' }}>
                        {multiple && (
                            <MeltaCheckbox
                                checked={
                                    Array.isArray(selectedValues)
                                        ? selectedValues.some((sv) => sv.value === option.value)
                                        : selectedValues?.value === option.value
                                }
                            />
                        )}
                        <ColoredEnumChip label={option.label} enumColor={colorsOptions?.[option.label] || 'default'} style={{ marginLeft: '8px' }} />
                    </Box>
                )}
                renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => {
                        const { key, onDelete, ...restTagProps } = getTagProps({ index });
                        return (
                            <ColoredEnumChip
                                key={key}
                                label={option.label}
                                enumColor={colorsOptions?.[option.label] || 'default'}
                                onDelete={onDelete}
                                deleteIcon={<Close />}
                                {...restTagProps}
                                style={{
                                    margin: '0 4px 4px 0',
                                }}
                            />
                        );
                    })
                }
                renderInput={(params) => (
                    <TextField
                        {...params}
                        fullWidth
                        variant="outlined"
                        error={false}
                        label={label}
                        slotProps={{
                            htmlInput: {
                                ...params.inputProps,
                            },
                        }}
                    />
                )}
                disableClearable={disableClearable}
            />
        </FormControl>
    );
};

export default SelectAutocomplete;
