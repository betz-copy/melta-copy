import { Grid } from '@mui/material';
import { WidgetProps } from '@rjsf/utils';
import React, { useState } from 'react';
import { IKartoffelUser, IKartoffelUserStringFields, IUser } from '../../../interfaces/users';
import UserAutocomplete from '../UserAutocomplete';

const RjsfUserWidget = ({
    disabled,
    label,
    value,
    rawErrors = [],
    onBlur,
    onFocus,
    id,
    autoFocus,
    options,
    onChange,
    ...textFieldProps
}: WidgetProps) => {
    const handleOnChange = options.updateExpandedUserFields as (user: IKartoffelUserStringFields | null, values: any) => void;
    const [currentUser, setCurrentUser] = useState(value ? JSON.parse(value) : undefined);
    if (!currentUser) {
        if (handleOnChange) handleOnChange(null, options.globalValues);
    }

    const handleUserChange = (_event: React.SyntheticEvent, chosenUser: IKartoffelUser | null) => {
        if (!chosenUser) {
            setCurrentUser(undefined);
            return;
        }
        const formattedUser: IKartoffelUserStringFields = {
            ...chosenUser,
            mobilePhone: chosenUser.mobilePhone?.join(','),
            phone: chosenUser.phone?.join(','),
        };
        if (handleOnChange) handleOnChange(formattedUser, options.globalValues);

        setCurrentUser(formattedUser);
    };

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
                        if (handleOnChange) handleOnChange(null, options.globalValues);
                        setCurrentUser(undefined);
                    }
                }}
                textFieldProps={textFieldProps}
            />
        </Grid>
    );
};

export default RjsfUserWidget;
