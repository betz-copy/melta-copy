import { WidgetProps } from '@rjsf/utils';
import { useState } from 'react';
import { UserArrayInput } from '../../UserArrayInput';

const RjsfUserArrayWidget = ({ label, value, onChange, rawErrors = [], onBlur, onFocus, options, required }: WidgetProps) => {
    const [inputValue, setInputValue] = useState('');
    const { defaultValue } = options;

    const users = Array.isArray(value) && value[0] ? value.map((user) => JSON.parse(user)) : (defaultValue ?? []);
    const [currentUsers, setCurrentUsers] = useState(Array.isArray(users) ? users.filter(Boolean) : []);

    if (!currentUsers.length || !currentUsers[0]) onChange(undefined);

    const serializeUser = (user) =>
        JSON.stringify({
            _id: user?._id ?? user?.id,
            fullName: user?.fullName,
            jobTitle: user?.jobTitle,
            hierarchy: user?.hierarchy,
            mail: user?.mail,
        });

    return (
        <UserArrayInput
            required={required}
            mode="kartoffel"
            value={null}
            label={label}
            onChange={(_e, chosenUser, reason) => {
                if (reason !== 'selectOption' || !chosenUser) return;
                setCurrentUsers((prev) => [...prev, chosenUser]);

                onChange([...currentUsers, chosenUser].map(serializeUser));
                setInputValue('');
            }}
            onBlur={onBlur}
            onFocus={onFocus}
            isError={!!rawErrors.length}
            displayValue={inputValue}
            onDisplayValueChange={(_, newDisplayValue) => setInputValue(newDisplayValue)}
            currentUsers={currentUsers}
            onRemove={(index) => {
                const removedUser = currentUsers[index];
                const currentUsersCopy = currentUsers;
                currentUsersCopy.splice(index, 1);

                const usersToSerialize = currentUsersCopy.length === 0 ? (Array.isArray(defaultValue) ? defaultValue : []) : currentUsersCopy;
                onChange(usersToSerialize.map(serializeUser));
                setCurrentUsers([...usersToSerialize]);
                return removedUser;
            }}
        />
    );
};

export default RjsfUserArrayWidget;
