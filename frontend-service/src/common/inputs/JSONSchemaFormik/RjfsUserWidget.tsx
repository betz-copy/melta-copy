import React from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Grid } from '@mui/material';
import UserAutocomplete from '../UserAutocomplete';
import { IKartoffelUser, IUser } from '../../../interfaces/users';

const RjfsUserWidget = ({
    disabled,
    label,
    value,
    rawErrors = [],
    onBlur,
    onFocus,
    id,
    autoFocus,
    options,

    ...textFieldProps
}: WidgetProps) => {
    const handleOnChange = options.updateExpandedUserFields as (user: IKartoffelUser | null) => void;

    const [currentUser, setCurrentUser] = React.useState(value ? JSON.parse(value) : undefined);
    if (!currentUser) {
        if (handleOnChange) handleOnChange(null);
    }

    function handleUserChange(_event: React.SyntheticEvent, chosenUser: IKartoffelUser | null) {
        if (handleOnChange) handleOnChange(chosenUser);
        if (!chosenUser) {
            setCurrentUser(undefined);
            return;
        }

        setCurrentUser(chosenUser);
    }

    return (
        <Grid>
            <UserAutocomplete
                mode="kartoffel"
                value={
                    currentUser
                        ? { _id: currentUser._id, displayName: `${currentUser.fullName} - ${currentUser.hierarchy}`, ...currentUser }
                        : undefined
                }
                label={label}
                onChange={(_event: React.SyntheticEvent, chosenUser: IUser | null) => handleUserChange(_event, chosenUser)}
                onBlur={({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, newValue)}
                onFocus={({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, newValue)}
                autoFocus={autoFocus}
                isError={rawErrors.length > 0}
                disabled={disabled}
                enableClear
                onDisplayValueChange={(_, newDisplayValue) => {
                    if (newDisplayValue === '') {
                        handleOnChange(null);
                        setCurrentUser(undefined);
                    }
                }}
                textFieldProps={textFieldProps}
            />
        </Grid>
    );
};

export default RjfsUserWidget;
