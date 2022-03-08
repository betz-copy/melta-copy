import React, { Dispatch, SetStateAction } from 'react';
import { Checkbox, FormControl, FormGroup, Select, MenuItem, Input, ListItemText, Typography, SelectChangeEvent } from '@mui/material';

const EntityCheckBox: React.FC<{
    templateToDisplay: string[];
    templatesNames: string[];
    setTemplatesToDisplay: Dispatch<SetStateAction<string[]>>;
}> = ({ templatesNames, templateToDisplay, setTemplatesToDisplay }) => {
    const handleChange = (event: SelectChangeEvent<string[]>) => {
        const updateName = event.target.value as string[];
        setTemplatesToDisplay(updateName);
    };

    return (
        <FormControl style={{ height: '5.5vh', marginTop: '1.5vh', width: '15vw', background: 'white', borderRadius: '0 7px 7px 0' }}>
            <FormGroup>
                <Select
                    onChange={handleChange}
                    value={templateToDisplay}
                    multiple
                    input={<Input style={{ height: '5vh', marginRight: '20px', fontWeight: '100' }} disableUnderline />}
                    renderValue={() => 'תבניות'}
                >
                    {templatesNames.map((name) => (
                        <MenuItem key={name} value={name}>
                            <Checkbox checked={templateToDisplay.includes(name)} />
                            <ListItemText primary={<Typography style={{ fontWeight: '100' }}> {name}</Typography>} />
                        </MenuItem>
                    ))}
                </Select>
            </FormGroup>
        </FormControl>
    );
};

export { EntityCheckBox };
