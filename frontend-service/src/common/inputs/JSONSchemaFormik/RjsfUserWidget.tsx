import { Grid } from '@mui/material';
import { WidgetProps } from '@rjsf/utils';
import React, { useState } from 'react';
import { IKartoffelUserStringFields } from '../../../interfaces/users';
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
    const handleOnChange = options.updateExpandedUserFields as (user: IKartoffelUserStringFields | null, values: any) => void;
    const [currentUser, setCurrentUser] = useState(value ? JSON.parse(value) : undefined);
    if (!currentUser) {
        if (handleOnChange) handleOnChange(null, options.globalValues);
    }

    return (
        <Grid>
            <UserInput
                value={
                    currentUser
                        ? { _id: currentUser._id, displayName: `${currentUser.fullName} - ${currentUser.hierarchy}`, ...currentUser }
                        : undefined
                }
                label={label}
                onBlur={({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, newValue)}
                onFocus={({ target: { value: newValue } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, newValue)}
                autoFocus={autoFocus}
                isError={rawErrors.length > 0}
                disabled={disabled}
                textFieldProps={textFieldProps}
                values={options.globalValues}
                currentUser={{ value: currentUser, set: setCurrentUser }}
                handleOnChange={(user: IKartoffelUserStringFields | null, values?: any) => handleOnChange(user, values)}
            />
        </Grid>
    );
};

export default RjsfUserWidget;
