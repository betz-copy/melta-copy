import React from 'react';
import { FormControl, FormGroup, Input, Typography, ListItemText, MenuItem, Select, Checkbox, SelectChangeEvent } from '@mui/material';

const SelectCheckbox: React.FC<{
    title: string;
    options: string[];
    optionsToHide: string[];
    handleChange: (event: SelectChangeEvent<string[]>) => void;
}> = ({ title, options, optionsToHide, handleChange }) => {
    return (
        <FormControl style={{ width: '15vw', background: 'white', borderRadius: '0 7px 7px 0', padding: '8px' }}>
            <FormGroup>
                <Select
                    onChange={handleChange}
                    value={optionsToHide}
                    multiple
                    displayEmpty
                    input={<Input style={{ marginRight: '20px', fontWeight: '100', marginTop: '5px' }} disableUnderline />}
                    renderValue={() => title}
                    MenuProps={{
                        PaperProps: {
                            style: {
                                maxHeight: '230px',
                            },
                        },
                    }}
                >
                    {options.map((value) => (
                        <MenuItem key={value} value={value}>
                            <Checkbox checked={!optionsToHide.includes(value)} />
                            <ListItemText primary={<Typography style={{ fontWeight: '100' }}>{value}</Typography>} />
                        </MenuItem>
                    ))}
                </Select>
            </FormGroup>
        </FormControl>
    );
};

export { SelectCheckbox };
