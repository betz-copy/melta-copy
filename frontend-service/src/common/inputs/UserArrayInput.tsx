import { Box, Grid } from '@mui/material';
import React from 'react';
import { v4 as uuid } from 'uuid';
import CreateUserCard from '../wizards/processTemplate/ApproverCard';
import UserAutocomplete, { IUserAutocomplete } from './UserAutocomplete';

interface UserArrayInputProps extends IUserAutocomplete {
    currentUsers: string[];
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
                    displayValue={displayValue}
                    onDisplayValueChange={onDisplayValueChange}
                />
            </Grid>
            <Grid container spacing={1}>
                {currentUsers.map((user, index) => (
                    <CreateUserCard
                        // eslint-disable-next-line react/no-array-index-key
                        key={uuid()}
                        userName={user}
                        userIndex={index}
                        remove={() => onRemove?.(index)}
                    />
                ))}
            </Grid>
        </Box>
    );
};

export { UserArrayInput };
