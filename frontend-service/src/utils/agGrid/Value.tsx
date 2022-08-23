/* eslint-disable react/jsx-no-useless-fragment */
import React from 'react';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton, InputAdornment, Input } from '@mui/material';

const Value: React.FC<{ hideValue: boolean; value: string }> = ({ hideValue, value }) => {
    const [hideField, setHideField] = React.useState(true);
    const handleClick = () => {
        setHideField((curr) => !curr);
    };
    if (!hideValue) return <>{value}</>;

    return (
        <Input
            type={hideField ? 'password' : 'text'}
            value={value}
            disabled
            disableUnderline
            sx={{
                margin: '5px',
                '& .MuiInputBase-input.Mui-disabled': {
                    WebkitTextFillColor: 'black',
                    font: '16px Rubik',
                    fontWeight: '200',
                },
                width: '92%',
            }}
            endAdornment={
                <InputAdornment position="end">
                    <IconButton onClick={handleClick} edge="end">
                        {hideField ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                </InputAdornment>
            }
        />
    );
};

export { Value };
