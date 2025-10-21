import React from 'react';
import { IKartoffelUser, IKartoffelUserStringFields, IUser } from '../../interfaces/users';
import UserAutocomplete, { IUserAutocomplete } from './UserAutocomplete';

interface UserInputProps extends Omit<IUserAutocomplete, 'mode' | 'onChange'> {
    handleOnChange: (user: IKartoffelUserStringFields | null, values?: any) => void;
    currentUser: { value: IKartoffelUserStringFields | undefined; set: React.Dispatch<IKartoffelUserStringFields | undefined> };
    values?: any;
}

const UserInput: React.FC<UserInputProps> = ({
    label,
    handleOnChange,
    value,
    currentUser,
    values,
    autoFocus,
    isError,
    disabled,
    textFieldProps,
    onBlur,
    onFocus,
    required,
}) => {
    const handleUserChange = (_event: React.SyntheticEvent, chosenUser: IKartoffelUser | null) => {
        if (!chosenUser) {
            currentUser.set(undefined);
            return;
        }

        const formattedUser: IKartoffelUserStringFields = {
            ...chosenUser,
            mobilePhone: chosenUser.mobilePhone?.join(','),
            phone: chosenUser.phone?.join(','),
        };

        handleOnChange(formattedUser, values);

        currentUser.set(formattedUser);
    };

    return (
        <UserAutocomplete
            mode="kartoffel"
            value={value}
            label={label}
            onChange={(_event: React.SyntheticEvent, chosenUser: IUser | null) => handleUserChange(_event, chosenUser)}
            onBlur={onBlur}
            onFocus={onFocus}
            autoFocus={autoFocus}
            isError={isError}
            disabled={disabled}
            enableClear
            onDisplayValueChange={(_, newDisplayValue) => {
                if (newDisplayValue) return;

                handleOnChange(null, values);
                currentUser.set(undefined);
            }}
            textFieldProps={textFieldProps}
            required={required}
        />
    );
};

export { UserInput };
