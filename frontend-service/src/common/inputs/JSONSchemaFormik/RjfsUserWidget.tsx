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
    onChange,
    formContext,
    ...textFieldProps
}: WidgetProps) => {
    const handleOnChange = options.updateExpandedUserFields as (
        user: (Omit<IKartoffelUser, 'mobilePhone' | 'phone'> & { mobilePhone?: string; phone?: string }) | null,
        values: any,
    ) => void;

    const [currentUser, setCurrentUser] = React.useState(value ? JSON.parse(value) : undefined);
    if (!currentUser) {
        if (handleOnChange) handleOnChange(null, formContext.globalValues);
    }

    function handleUserChange(_event: React.SyntheticEvent, chosenUser: IKartoffelUser | null) {
        if (!chosenUser) {
            setCurrentUser(undefined);
            return;
        }
        const formattedUser: Omit<IKartoffelUser, 'mobilePhone' | 'phone'> & { mobilePhone?: string; phone?: string } = {
            ...chosenUser,
            mobilePhone: chosenUser.mobilePhone?.join(''),
            phone: chosenUser.phone?.join(''),
        };
        if (handleOnChange) handleOnChange(formattedUser, formContext.globalValues);

        setCurrentUser(formattedUser);
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
                        if (handleOnChange) handleOnChange(null, formContext.globalValues);
                        setCurrentUser(undefined);
                    }
                }}
                textFieldProps={textFieldProps}
            />
        </Grid>
    );
};

export default RjfsUserWidget;
