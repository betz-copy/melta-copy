import { WidgetProps } from '@rjsf/utils';
import React from 'react';
import { UserArrayInput } from '../UserArrayInput';

const RjsfUserArrayWidget = ({ label, value, onChange, rawErrors = [], onBlur, onFocus, options }: WidgetProps) => {
    const [inputValue, setInputValue] = React.useState('');
    const { defaultValue } = options;

    const users = Array.isArray(value) && value[0] ? value.map((user) => JSON.parse(user)) : defaultValue ?? [];
    const [currentUsers, setCurrentUsers] = React.useState(Array.isArray(users) ? users.filter(Boolean) : []);


    if (!currentUsers.length || !currentUsers[0]) onChange(undefined);

    return (
        <UserArrayInput
            mode="external"
            value={null}
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
            currentUsers={currentUsers}
            onRemove={(index) => {
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
    );
};

export default RjsfUserArrayWidget;
