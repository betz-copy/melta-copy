import { Box, Grid } from '@mui/material';
import React from 'react';
import CreateUserCard from '../wizards/processTemplate/ApproverCard';
import UserAutocomplete, { IUserAutocomplete } from './UserAutocomplete';
import { IUser } from '../../interfaces/users';

interface UserArrayInputProps extends IUserAutocomplete {
    currentUsers: string[] | IUser[];
    onRemove?: <T>(index: number) => T | undefined;
}

const UserArrayInput: React.FC<UserArrayInputProps> = ({
    label,
    mode,
    value,
    onChange,
    onBlur,
    onFocus,
    isError,
    displayValue,
    onDisplayValueChange,
    currentUsers,
    onRemove,
    overrideSx,
    readOnly,
    helperText,
    required,
}) => {
    return (
        <Box>
            <Grid marginBottom={2}>
                <UserAutocomplete
                    mode={mode}
                    value={value}
                    label={label}
                    onChange={(_e, chosenUser, reason) => {
                        onChange?.(_e, chosenUser, reason);
                    }}
                    onBlur={onBlur}
                    onFocus={onFocus}
                    isError={isError}
                    helperText={helperText}
                    displayValue={displayValue}
                    onDisplayValueChange={onDisplayValueChange}
                    overrideSx={overrideSx}
                    readOnly={readOnly}
                    required={required}
                />
            </Grid>
            <Box
                sx={{
                    maxHeight: '90px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                }}
            >
                <Grid container spacing={1}>
                    {currentUsers.map((user, index) => (
                        <CreateUserCard key={user} user={user} userIndex={index} remove={() => onRemove?.(index)} readOnly={readOnly} />
                    ))}
                </Grid>
            </Box>
        </Box>
    );
};

export { UserArrayInput };
