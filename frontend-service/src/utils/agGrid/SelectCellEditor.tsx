import React, { useEffect, useState } from 'react';
import { Autocomplete, TextField, Box } from '@mui/material';
import { Close } from '@mui/icons-material';
import { MeltaCheckbox } from '../../common/MeltaCheckbox';
import { ColoredEnumChip } from '../../common/ColoredEnumChip';

export interface Option {
    value: string;
    label: string;
}

interface SelectCellEditorProps {
    options: string[];
    value?: string | string[];
    onValueChange: (newValue: string | string[] | null) => void;
    multiple?: boolean;
    colorsOptions?: Record<string, string>;
    overrideSx?: object;
    disableClearable?: boolean;
    label?: string;
}

const SelectCellEditor: React.FC<SelectCellEditorProps> = ({ options, value, onValueChange, multiple = false, colorsOptions }) => {
    const [selectedValues, setSelectedValues] = useState<string | string[] | undefined>(value || (multiple ? [] : ''));

    useEffect(() => {
        setSelectedValues(value || (multiple ? [] : ''));
    }, [value, multiple]);

    const handleAutocompleteChange = (newValue: string | string[] | null) => {
        // eslint-disable-next-line no-nested-ternary
        const updatedValue = newValue === null ? (multiple ? [] : '') : newValue;
        setSelectedValues(updatedValue);
        onValueChange(updatedValue);
    };

    return (
        <Autocomplete<string, boolean>
            multiple={multiple}
            value={selectedValues}
            onChange={(_, newValue) => handleAutocompleteChange(newValue)}
            disableCloseOnSelect={multiple}
            options={options}
            fullWidth
            getOptionLabel={(option) => option}
            isOptionEqualToValue={(option, val) => option === val}
            renderOption={(props, option) => (
                <Box component="li" {...props} key={option} style={{ height: '40px' }}>
                    {multiple && <MeltaCheckbox checked={Array.isArray(selectedValues) && selectedValues.includes(option)} />}
                    <ColoredEnumChip label={option} color={colorsOptions?.[option] || 'default'} style={{ marginLeft: '8px' }} />
                </Box>
            )}
            renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => {
                    const { key, onDelete, ...restTagProps } = getTagProps({ index });
                    return (
                        <ColoredEnumChip
                            key={key}
                            label={option}
                            color={colorsOptions?.[option] || 'default'}
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
                    inputProps={{
                        ...params.inputProps,
                    }}
                    sx={{
                        '& .MuiAutocomplete-listbox': {
                            '::webkit-scrollbar': {
                                width: '8px',
                                backgroundColor: '#CCCFE5',
                            },
                            '::webkit-scrollbar-thumb': {
                                backgroundColor: '#CCCFE5',
                                borderRadius: '4px',
                            },
                            '::webkit-scrollbar-thumb:hover': {
                                backgroundColor: '#CCCFE5',
                            },
                        },
                    }}
                />
            )}
        />
    );
};

export default SelectCellEditor;
