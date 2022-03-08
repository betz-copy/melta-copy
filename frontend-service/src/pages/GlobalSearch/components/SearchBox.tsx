import React from 'react';
import { Box, Grid, Input, IconButton } from '@mui/material';
import { TravelExplore } from '@mui/icons-material';

const SearchBox: React.FC<{}> = () => {
    const [inputField, setInputField] = React.useState('');

    const handleChange = (ev: any) => {
        setInputField(ev.target.value);
    };

    return (
        <Grid container justifyContent="center">
            <Grid item margin="5px" style={{ background: '#e7f0ff7a', maxWidth: 450, width: '90%' }}>
                <Box
                    style={{
                        margin: '10px',
                        background: 'white',
                        borderRadius: '7px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        border: '3px solid rgba(0, 0, 0, 0.54)',
                    }}
                >
                    <Input
                        style={{ marginRight: '10px', width: '300px', height: '5vh', fontWeight: '500' }}
                        disableUnderline
                        placeholder="חיפוש רוחבי"
                        value={inputField}
                        onChange={handleChange}
                    />
                    <IconButton>
                        <TravelExplore />
                    </IconButton>
                </Box>
            </Grid>
        </Grid>
    );
};

export { SearchBox };
