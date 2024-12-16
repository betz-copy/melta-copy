import React from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Box, Grid } from '@mui/material';
import UserAutocomplete from '../UserAutocomplete';
import CreateUserCard from '../../wizards/processTemplate/ApproverCard';

const RjfsUserArrayWidget = ({ label, value, onChange, rawErrors = [], onBlur, onFocus }: WidgetProps) => {
    const [inputValue, setInputValue] = React.useState('');
    const [currentUsers, setCurrentUsers] = React.useState(
        (value && value.length && value[0] ? value.map((user) => JSON.parse(user)) : []).filter((user) => !!user),
    );

    if (!currentUsers.length || !currentUsers[0]) onChange(undefined);

    return (
        <Box sx={{ bgcolor: 'white' }}>
            <Grid marginBottom={2}>
                <UserAutocomplete
                    mode="external"
                    value={undefined}
                    label={label}
                    onChange={(_e, chosenUser, reason) => {
                        if (reason !== 'selectOption' || !chosenUser) return;
                        setCurrentUsers((prev) => [...prev, chosenUser]);
                        onChange(
                            [...currentUsers, chosenUser].map((user) => {
                                return JSON.stringify({
                                    _id: user?._id,
                                    fullName: user?.fullName,
                                    jobTitle: user?.jobTitle,
                                    hierarchy: user?.hierarchy,
                                    mail: user?.mail,
                                });
                            }),
                        );
                        setInputValue('');
                    }}
                    onBlur={onBlur}
                    onFocus={onFocus}
                    isError={rawErrors.length > 0}
                    displayValue={inputValue}
                    onDisplayValueChange={(_, newDisplayValue) => setInputValue(newDisplayValue)}
                />
            </Grid>
            <Grid container spacing={1}>
                {currentUsers.map((user, index) => (
                    <CreateUserCard
                        key={user._id}
                        userName={user.fullName}
                        userIndex={index}
                        remove={() => {
                            const removedUser = currentUsers[index];
                            const currentUsersCopy = currentUsers;
                            currentUsersCopy.splice(index, 1);
                            onChange(
                                currentUsersCopy.map((userCopy) => {
                                    return JSON.stringify({
                                        _id: userCopy?._id,
                                        fullName: userCopy?.fullName,
                                        jobTitle: userCopy?.jobTitle,
                                        hierarchy: userCopy?.hierarchy,
                                        mail: userCopy?.mail,
                                    });
                                }),
                            );
                            setCurrentUsers([...currentUsersCopy]);
                            return removedUser;
                        }}
                    />
                ))}
            </Grid>
        </Box>
    );
};

export default RjfsUserArrayWidget;
