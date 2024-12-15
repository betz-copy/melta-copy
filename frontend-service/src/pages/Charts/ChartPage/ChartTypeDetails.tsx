import { Autocomplete, Grid, TextField } from '@mui/material';
import React from 'react';

const ChartTypeDetails: React.FC<{
    properties: string[];
    xAxis: string;
    setXAxis: React.Dispatch<React.SetStateAction<string>>;
    yAxis: string;
    setYAxis: React.Dispatch<React.SetStateAction<string>>;
}> = ({ properties, xAxis, setXAxis, yAxis, setYAxis }) => {
    return (
        <Grid container spacing={2}>
            <Grid item>
                <Autocomplete
                    id="template"
                    options={properties}
                    onChange={(_e, value) => setXAxis(value)}
                    value={xAxis}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            size="small"
                            fullWidth
                            sx={{
                                '& .MuiInputBase-root': {
                                    borderRadius: '10px',
                                    width: '400px',
                                },
                                '& fieldset': {
                                    borderColor: '#CCCFE5',
                                    color: '#CCCFE5',
                                },
                                '& label': {
                                    color: '#9398C2',
                                },
                            }}
                            name="template"
                            variant="outlined"
                            label="ציר x"
                        />
                    )}
                />
            </Grid>
            <Grid item>
                <Autocomplete
                    id="template"
                    options={properties}
                    onChange={(_e, value) => setYAxis(value)}
                    value={yAxis}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            size="small"
                            fullWidth
                            sx={{
                                '& .MuiInputBase-root': {
                                    borderRadius: '10px',
                                    width: '400px',
                                },
                                '& fieldset': {
                                    borderColor: '#CCCFE5',
                                    color: '#CCCFE5',
                                },
                                '& label': {
                                    color: '#9398C2',
                                },
                            }}
                            name="template"
                            variant="outlined"
                            label="ציר y"
                        />
                    )}
                />
            </Grid>
        </Grid>
    );
};

export { ChartTypeDetails };
