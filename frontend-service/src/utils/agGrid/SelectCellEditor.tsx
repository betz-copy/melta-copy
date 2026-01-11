import { Close } from '@mui/icons-material';
import { Autocomplete, Box, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { ColoredEnumChip } from '../../common/ColoredEnumChip';
import MeltaCheckbox from '../../common/MeltaDesigns/MeltaCheckbox';
import OverflowWrapper from './OverflowWrapper';

interface SelectCellEditorProps {
    options: string[];
    value?: string | string[];
    onValueChange: (newValue: string | string[] | null) => void;
    multiple?: boolean;
    colorsOptions?: Record<string, string>;
}

const SelectCellEditor: React.FC<SelectCellEditorProps> = ({ options, value, onValueChange, multiple = false, colorsOptions }) => {
    const [selectedValues, setSelectedValues] = useState<string | string[] | undefined>(value || (multiple ? [] : ''));

    useEffect(() => {
        setSelectedValues(value || (multiple ? [] : ''));
    }, [value, multiple]);

    const handleAutocompleteChange = (newValue: string | string[] | null) => {
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
                    <ColoredEnumChip label={option} enumColor={colorsOptions?.[option] || 'default'} style={{ marginLeft: '8px' }} />
                </Box>
            )}
            renderTags={(tagValue, getTagProps) => (
                <OverflowWrapper
                    items={tagValue}
                    getItemKey={(item) => item}
                    renderItem={(item, index) => {
                        const { key: _k, onDelete, ...restTagProps } = getTagProps({ index });

                        return (
                            <ColoredEnumChip
                                label={item}
                                enumColor={colorsOptions?.[item] || 'default'}
                                onDelete={onDelete}
                                deleteIcon={<Close />}
                                {...restTagProps}
                                style={{ margin: '2px 4px 2px 0' }}
                            />
                        );
                    }}
                />
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    fullWidth
                    variant="outlined"
                    error={false}
                    slotProps={{
                        htmlInput: {
                            ...params.inputProps,
                            startAdornment:
                                value && !Array.isArray(value) ? (
                                    <ColoredEnumChip label={value} enumColor={colorsOptions?.[value] || 'default'} />
                                ) : undefined,
                            inputProps: {
                                ...params.inputProps,
                                style: value ? { display: 'none' } : {},
                            },
                        },
                    }}
                />
            )}
        />
    );
};

export default SelectCellEditor;
