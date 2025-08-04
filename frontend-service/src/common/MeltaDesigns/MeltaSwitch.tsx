import { Switch, SxProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

interface MeltaSwitchProps {
    id: string;
    name: string;
    checked: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
    disabled?: boolean;
    overrideSx?: SxProps<any>;
    onKeyDown?: (e: React.KeyboardEvent) => void;
}

const MeltaSwitch: React.FC<MeltaSwitchProps> = ({ id, name, checked, onChange, disabled, overrideSx, onKeyDown }) => {
    const SwitchDesign = styled(Switch)(({ theme }) => ({
        width: 28,
        height: 16,
        padding: 0,
        margin: 5,
        display: 'flex',

        '& .MuiSwitch-switchBase': {
            padding: 2,
            transition: theme.transitions.create(['transform'], {
                duration: 200,
            }),

            '&.Mui-checked': {
                transform: 'translateX(12px)',
                color: '#fff',

                '& + .MuiSwitch-track': {
                    backgroundColor: theme.palette.primary.main,
                    opacity: 1,
                },

                '&:hover + .MuiSwitch-track': {
                    backgroundColor: theme.palette.primary.dark,
                },

                '&.Mui-disabled + .MuiSwitch-track': {
                    backgroundColor: '#bdbdbd',
                    opacity: 1,
                },
            },

            '&:hover + .MuiSwitch-track': {
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
            },

            '&.Mui-disabled + .MuiSwitch-track': {
                backgroundColor: '#e0e0e0',
                opacity: 1,
            },

            '&.Mui-disabled .MuiSwitch-thumb': {
                backgroundColor: '#c4c4c4',
            },
        },

        '& .MuiSwitch-thumb': {
            boxShadow: '0 2px 4px 0 rgb(0 35 11 / 20%)',
            width: 12,
            height: 12,
            borderRadius: 6,
            transition: theme.transitions.create(['width', 'background-color'], {
                duration: 200,
            }),
        },

        '& .MuiSwitch-track': {
            borderRadius: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            opacity: 1,
            transition: theme.transitions.create(['background-color'], {
                duration: 200,
            }),
            boxSizing: 'border-box',
        },
    }));

    return (
        <SwitchDesign
            id={id}
            name={name}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            sx={{ ...overrideSx, color: disabled ? 'rgba(0, 0, 0, 0.38)' : 'inherit' }}
            onKeyDown={onKeyDown}
        />
    );
};

export default MeltaSwitch;
