import React, { useEffect, useState } from 'react';
import { FormControl, TextField, Autocomplete, InputAdornment, Select, MenuItem, ListItemText, SelectChangeEvent } from '@mui/material';
import { MeltaCheckbox } from '../../common/MeltaCheckbox';

interface SelectCellEditorProps {
    values: string[];
    value?: string | string[];
    onValueChange: (newValue: string | string[] | null) => void;
    multiple?: boolean;
}

const SelectCellEditor: React.FC<SelectCellEditorProps> = ({ values, value, onValueChange, multiple = false }) => {
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
        <FormControl fullWidth>
            {multiple ? (
                <Select
                    multiple
                    value={selectedValues}
                    onChange={handleChange}
                    renderValue={(selected) => (selected as string[]).join(', ')}
                    style={{ width: '100%', height: '100%' }}
                >
                    {values.map((option) => (
                        <MenuItem key={option} value={option} style={{ height: '40px' }}>
                            <MeltaCheckbox checked={selectedValues!.indexOf(option) > -1} />
                            <ListItemText primary={option} />
                        </MenuItem>
                    ))}
                </Select>
            ) : (
                <Autocomplete<string | string[], boolean>
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
                    options={values.map((option) => option).sort()}
                    getOptionDisabled={(option) => (multiple ? Boolean(value?.includes(option as string)) : false)}
                />
            )}
        </FormControl>
    );
};

export default SelectCellEditor;
