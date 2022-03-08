import React from 'react';
import { FormControl, FormGroup, TextField, Box, Typography } from '@mui/material';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import DatePicker from '@mui/lab/DatePicker';
import { he } from 'date-fns/locale';

const DateFiltering: React.FC<{}> = () => {
    const [firstValue, setFirstValue] = React.useState(null);
    const [secondValue, setSecondValue] = React.useState(null);

    return (
        <FormControl
            style={{
                height: '5.5vh',
                marginTop: '1.5vh',
                width: '100%',
                background: 'white',
                borderRight: '1px solid #0000002b',
                paddingLeft: '1vh',
                borderRadius: '7px  0 0 7px ',
            }}
        >
            <FormGroup style={{ display: 'flex', flexDirection: 'row' }}>
                <LocalizationProvider dateAdapter={AdapterDateFns} locale={he}>
                    <DatePicker
                        label={<Typography style={{ fontWeight: '100' }}>תאריך התחלה</Typography>}
                        inputFormat="dd/MM/yyyy"
                        value={firstValue}
                        InputProps={{ disableUnderline: true }}
                        onChange={(newValue) => {
                            setFirstValue(newValue);
                            setSecondValue(newValue);
                        }}
                        renderInput={(params) => (
                            <TextField variant="standard" {...params} style={{ marginRight: '1vh', marginTop: '-7px', width: '40%' }} />
                        )}
                    />
                </LocalizationProvider>
                <Box style={{ width: '10%' }} />
                <LocalizationProvider dateAdapter={AdapterDateFns} locale={he}>
                    <DatePicker
                        label={<Typography style={{ fontWeight: '100' }}> תאריך סיום</Typography>}
                        inputFormat="dd/MM/yyyy"
                        value={secondValue}
                        InputProps={{ disableUnderline: true }}
                        onChange={(newValue) => {
                            setSecondValue(newValue);
                            if (firstValue === null) setFirstValue(newValue);
                        }}
                        renderInput={(params) => (
                            <TextField variant="standard" {...params} style={{ marginRight: '1vh', marginTop: '-7px', width: '40%' }} />
                        )}
                    />
                </LocalizationProvider>
            </FormGroup>
        </FormControl>
    );
};

export { DateFiltering };
