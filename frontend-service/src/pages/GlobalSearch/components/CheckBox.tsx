import React, { useEffect } from 'react';
import { Checkbox, FormControl, FormGroup, Select, MenuItem, Input, ListItemText, Typography } from '@mui/material';

const EntityCheckBox: React.FC<{
    templateToDisplay: string[];
    templatesNames: string[];
    setTemplatesToDisplay: React.Dispatch<React.SetStateAction<string[]>>;
}> = ({ templatesNames, templateToDisplay, setTemplatesToDisplay }) => {
    const [open, setOpen] = React.useState(false);
    useEffect(() => {
        setTemplatesToDisplay([...templatesNames]);
    }, []);

    const handleChange = (ev: any) => {
        setOpen(false);
        const { value: updateName } = ev.target;
        setTemplatesToDisplay((prev) => {
            return prev.includes(updateName) ? prev.filter((name) => name !== updateName) : [...prev, updateName];
        });
    };

    const handleClick = () => {
        setOpen((prev) => !prev);
    };

    return (
        <FormControl style={{ height: '5.5vh', marginTop: '1.5vh', width: '100%', background: 'white', borderRadius: '0 7px 7px 0' }}>
            <FormGroup>
                <Select
                    displayEmpty
                    value=""
                    open={open}
                    onOpen={handleClick}
                    onClose={handleClick}
                    onChange={handleChange}
                    input={<Input style={{ height: '5vh', marginRight: '20px', fontWeight: '100' }} disableUnderline />}
                    renderValue={(_selected) => 'תבניות'}
                >
                    {templatesNames.map((name) => (
                        <MenuItem key={name} value={name}>
                            <Checkbox checked={templateToDisplay.indexOf(name) > -1} />
                            <ListItemText primary={<Typography style={{ fontWeight: '100' }}> {name}</Typography>} />
                        </MenuItem>
                    ))}
                </Select>
            </FormGroup>
        </FormControl>
    );
};

export { EntityCheckBox };
