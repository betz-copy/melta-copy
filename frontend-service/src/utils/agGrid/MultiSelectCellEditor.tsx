import React, { useEffect, useState } from 'react';
import { Select, MenuItem, Checkbox, ListItemText, FormControl } from '@mui/material';

interface MultiSelectCellEditorProps {
    values: string[];
    value?: string[];
    onValueChange: (newValue: string[]) => void;
}

const MultiSelectCellEditor: React.FC<MultiSelectCellEditorProps> = ({ values, value, onValueChange }) => {
    const [selectedValues, setSelectedValues] = useState<string[]>(value || []);

    useEffect(() => {
        setSelectedValues(value || []);
    }, [value]);

    const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        const newSelectedValues = event.target.value as string[];
        setSelectedValues(newSelectedValues);
        onValueChange(newSelectedValues);
    };

    return (
        <FormControl style={{ width: '100%', height: '100%' }}>
            <Select
                multiple
                value={selectedValues}
                onChange={handleChange}
                renderValue={(selected) => selected.join(', ')}
                style={{ width: '100%', height: '100%' }}
            >
                {values.map((option) => (
                    <MenuItem key={option} value={option} style={{ height: '40px' }}>
                        <Checkbox checked={selectedValues.indexOf(option) > -1} />
                        <ListItemText primary={option} />
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export default MultiSelectCellEditor;
