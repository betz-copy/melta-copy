import { WidgetProps } from '@rjsf/utils';
import React, { useState } from 'react';
import { UserInput } from '../UserInput';

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
    const [currentUser, setCurrentUser] = useState(value ? JSON.parse(value) : undefined);

    const handleOnChange = options.updateExpandedUserFields;

    if (!currentUser) if (handleOnChange) handleOnChange(null, options.globalValues);

    return (
        <UserInput
            value={
                currentUser ? { _id: currentUser._id, displayName: `${currentUser.fullName} - ${currentUser.hierarchy}`, ...currentUser } : undefined
            }
            label={label}
            onBlur={({ target: { value: newValue } }) => onBlur(id, newValue)}
            onFocus={({ target: { value: newValue } }) => onFocus(id, newValue)}
            autoFocus={autoFocus}
            isError={rawErrors.length > 0}
            disabled={disabled}
            textFieldProps={textFieldProps}
            values={options.globalValues}
            currentUser={{ value: currentUser, set: setCurrentUser }}
            handleOnChange={handleOnChange}
        />
    );
};

export default RjsfUserWidget;
