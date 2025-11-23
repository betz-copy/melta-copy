import { WidgetProps } from '@rjsf/utils';
import { useEffect, useState } from 'react';
import { UserInput } from '../UserInput';

const RjsfUserWidget = ({
    disabled,
    label,
    value,
    rawErrors = [],
    onBlur,
    onFocus,
    id,
    autofocus,
    options,
    onChange,
    uiSchema,
    hideLabel,
    readonly,
    hideError,
    formContext,
    required,
    ...textFieldProps
}: WidgetProps) => {
    const [currentUser, setCurrentUser] = useState(value ? JSON.parse(value) : undefined);

    const handleOnChange = options.updateExpandedUserFields;

    useEffect(() => {
        if (!currentUser && handleOnChange) handleOnChange(null, options.globalValues);
    }, [currentUser, handleOnChange, options.globalValues]);

    return (
        <UserInput
            value={
                currentUser
                    ? {
                          _id: currentUser._id,
                          displayName: `${currentUser.fullName} - ${currentUser.hierarchy}`,
                          userType: currentUser.entityType,
                          ...currentUser,
                      }
                    : undefined
            }
            label={label}
            onBlur={({ target: { value: newValue } }) => onBlur(id, newValue)}
            onFocus={({ target: { value: newValue } }) => onFocus(id, newValue)}
            autoFocus={autofocus}
            isError={!!rawErrors.length}
            disabled={disabled}
            required={required}
            textFieldProps={{
                ...textFieldProps,
                uischema: uiSchema,
                hidelabel: hideLabel?.toString(),
                readOnly: readonly,
                hideerror: hideError,
                formcontext: formContext,
            }}
            values={options.globalValues}
            currentUser={{ value: currentUser, set: setCurrentUser }}
            handleOnChange={handleOnChange}
        />
    );
};

export default RjsfUserWidget;
