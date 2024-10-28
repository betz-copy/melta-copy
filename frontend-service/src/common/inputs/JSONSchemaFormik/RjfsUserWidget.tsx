import React from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Grid } from '@mui/material';
import UserAutocomplete from '../UserAutocomplete';
import { IUser } from '../../../interfaces/users';

const RjfsUserWidget = ({ disabled, label, value, onChange, rawErrors = [] }: WidgetProps) => {
    const [_inputValue, setInputValue] = React.useState('');
    const [currentUser, setCurrentUser] = React.useState(value ? JSON.parse(value) : undefined);

    const handleUserChange = (_event: React.SyntheticEvent, chosenUser: IUser | null) => {
        onChange(
            JSON.stringify({
                _id: chosenUser?._id,
                fullName: chosenUser?.fullName,
                jobTitle: chosenUser?.jobTitle,
                hierarchy: chosenUser?.hierarchy,
                mail: chosenUser?.mail,
            }),
        );

        setInputValue('');
        setCurrentUser(chosenUser);
    };

    return (
        <Grid>
            <UserAutocomplete
                mode="external"
                value={currentUser ? { displayName: `${currentUser.fullName} - ${currentUser.hierarchy}`, ...currentUser } : null}
                label={label}
                onChange={handleUserChange}
                isError={rawErrors.length > 0}
                disabled={disabled}
            />
        </Grid>
    );
};

export default RjfsUserWidget;
