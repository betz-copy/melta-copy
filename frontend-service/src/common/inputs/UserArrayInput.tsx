import { Box, Grid, Typography } from '@mui/material';
import React from 'react';
import CreateUserCard from '../wizards/processTemplate/ApproverCard';
import UserAutocomplete, { IUserAutocomplete } from './UserAutocomplete';
import { IUser } from '../../interfaces/users';
import { MeltaTooltip } from '../MeltaTooltip';
import { getNameInitials } from '../../utils/userProfile';

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
}) => {
    const maxVisible = 3;
    const visibleUsers = currentUsers.slice(0, maxVisible);
    const hiddenUsers = currentUsers.slice(maxVisible);
    console.log({ hiddenUsers });

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
                    overrideSx={overrideSx}
                    readOnly={readOnly}
                />
            </Grid>
            <Grid container spacing={1} alignItems="center">
                {visibleUsers.map((user: IUser | string, index: number) => (
                    <Grid item key={String(user)}>
                        <CreateUserCard user={user} userIndex={index} remove={() => onRemove?.(index)} readOnly={readOnly} />
                    </Grid>
                ))}

                {hiddenUsers.length > 0 && (
                    <Grid item style={{ cursor: 'pointer' }} key="more">
                        <MeltaTooltip
                            title={
                                <Box>
                                    {hiddenUsers.map((user) => (
                                        <Typography key={String(user)} style={{ margin: '5px' }}>
                                            {typeof user === 'string' ? user : user.fullName}
                                        </Typography>
                                    ))}
                                </Box>
                            }
                            arrow
                        >
                            <Grid
                                container
                                alignItems="center"
                                justifyContent="center"
                                sx={{
                                    borderRadius: '30px',
                                    height: '24px',
                                    width: '24px',
                                    background: 'var(--Gray-Medium, #9398C2)',
                                }}
                            >
                                <Typography color="white" fontWeight={500} fontSize="12px">
                                    +{hiddenUsers.length}
                                </Typography>
                            </Grid>
                        </MeltaTooltip>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export { UserArrayInput };
