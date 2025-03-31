import React, { useEffect, useState } from 'react';
import { FormControl, TextField, Autocomplete, InputAdornment, Select, MenuItem, ListItemText, SelectChangeEvent, Box } from '@mui/material';
import { MeltaCheckbox } from '../../common/MeltaCheckbox';
import { ColoredEnumChip } from '../../common/ColoredEnumChip';

interface SelectCellEditorProps {
    values: string[];
    value?: string | string[];
    onValueChange: (newValue: string | string[] | null) => void;
    multiple?: boolean;
    colorsOptions?: Record<string, string>;
    overrideSx?: object;
}

const SelectCellEditor: React.FC<SelectCellEditorProps> = ({ values, value, onValueChange, multiple = false, colorsOptions, overrideSx }) => {
    const [selectedValues, setSelectedValues] = useState<string | string[] | undefined>(value);

    useEffect(() => {
        setSelectedValues(value || (multiple ? [] : ''));
    }, [value, multiple]);

    const handleChange = (event: SelectChangeEvent<string | string[] | null>) => {
        const newValue = event.target.value;
        setSelectedValues(newValue as string | string[]);
        onValueChange(newValue as string | string[]);
    };

    const handleAutocompleteChange = (newValue: string | string[] | null) => {
        // eslint-disable-next-line no-nested-ternary
        const updatedValue = newValue === null ? (multiple ? [] : '') : newValue;
        setSelectedValues(updatedValue);
        onValueChange(updatedValue);
    };

    return (
        <FormControl fullWidth={!!(overrideSx && 'width' in overrideSx && overrideSx.width === '100%')}>
            {multiple ? (
                /** MULTIPLE SELECTION MODE (via <Select>) * */
                <Select
                    multiple
                    value={selectedValues}
                    onChange={handleChange}
                    // Render colored chips when displaying selected items
                    renderValue={(selected) => (
                        <Box>
                            {(selected as string[]).map((val) => (
                                <ColoredEnumChip key={val} label={val} color={colorsOptions?.[val] || 'default'} />
                            ))}
                        </Box>
                    )}
                    style={{ ...overrideSx }}
                >
                    {values.map((option) => (
                        <MenuItem key={option} value={option} style={{ height: '40px' }}>
                            <MeltaCheckbox checked={(selectedValues as string[]).indexOf(option) > -1} />
                            {colorsOptions ? (
                                <ColoredEnumChip label={option} color={colorsOptions[option] || 'default'} />
                            ) : (
                                <ListItemText primary={option} />
                            )}
                        </MenuItem>
                    ))}
                </Select>
            ) : (
                <Autocomplete<string, boolean>
                    multiple={multiple}
                    value={selectedValues}
                    onChange={(_, newValue) => handleAutocompleteChange(newValue as string | string[] | null)}
                    isOptionEqualToValue={(option, val) => option === val}
                    fullWidth
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            InputProps={{
                                ...params.InputProps,
                                startAdornment: <InputAdornment position="start" />,
                            }}
                        />
                    )}
                    renderOption={(props, option) =>
                        colorsOptions ? (
                            <li {...props} key={option}>
                                <ColoredEnumChip label={option} color={colorsOptions[option] || 'default'} />
                            </li>
                        ) : (
                            <span {...props}>{option}</span>
                        )
                    }
                    options={values.map((option) => option).sort()}
                    getOptionDisabled={(option) => (multiple ? Boolean(value?.includes(option as string)) : false)}
                />
            )}
        </FormControl>
    );
};

export default SelectCellEditor;
