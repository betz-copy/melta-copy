import React from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Grid } from '@mui/material';
import UserAutocomplete from '../UserAutocomplete';
import { IKartoffelUser, IUser } from '../../../interfaces/users';

const RjfsUserWidget = ({
    disabled,
    label,
    value,
    onChange,
    rawErrors = [],
    onBlur,
    onFocus,
    id,
    autoFocus,
    options,

    ...textFieldProps
}: WidgetProps) => {
    // const { updateExpandedUserFields } = options;
    // TODO: lir
    const onC = options.updateExpandedUserFields as (user: IKartoffelUser | null) => void;

    const [currentUser, setCurrentUser] = React.useState(value ? JSON.parse(value) : undefined);
    if (!currentUser) {
        console.log('updatee!!3');
        if (onC) onC(null);
        onChange(undefined);
    }

    function handleUserChange(_event: React.SyntheticEvent, chosenUser: IKartoffelUser | null) {
        console.log('updatee!!2', { chosenUser });
        if (onC) onC(chosenUser);
        if (!chosenUser) {
            setCurrentUser(undefined);
            return;
        }
        onChange(
            JSON.stringify({
                _id: chosenUser?._id || chosenUser?.id,
                fullName: chosenUser?.fullName,
                jobTitle: chosenUser?.jobTitle,
                hierarchy: chosenUser?.hierarchy,
                mail: chosenUser?.mail,
            }),
            // chosenUser,
        );

        setCurrentUser(chosenUser);
    }

    return (
        <Grid>
            <UserAutocomplete
                mode="kartoffel"
                // mode="external"
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
                        onChange(undefined);
                        setCurrentUser(undefined);
                    }
                }}
                textFieldProps={textFieldProps}
            />
        </Grid>
    );
};

export default RjfsUserWidget;
