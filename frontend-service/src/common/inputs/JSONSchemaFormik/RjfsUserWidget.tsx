import React from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Avatar, AvatarGroup, Grid } from '@mui/material';
import UserAutocomplete from '../UserAutocomplete';
import { IUser } from '../../../interfaces/users';
import { MeltaTooltip } from '../../MeltaTooltip';
import UserAvatar from '../../UserAvatar';

// TODO - add multiple option
const RjfsUserWidget = ({
    id,
    required,
    disabled,
    label,
    value,
    onChange,
    onBlur,
    onFocus,
    rawErrors = [],
    schema,
    uiSchema,
    formContext,
    ...widgetProps
}: WidgetProps) => {
    const [inputValue, setInputValue] = React.useState('');

    const handleUserChange = (_event: React.SyntheticEvent, chosenUser: IUser | null) => {
        // TODO - according to multiple parameter
        // value.push({
        //     _id: chosenUser?._id,
        //     fullName: chosenUser?.fullName,
        //     jobTitle: chosenUser?.jobTitle,
        //     hierarchy: chosenUser?.hierarchy,
        //     mail: chosenUser?.mail,
        // });
        // const users = value.filter((val) => !!val);
        onChange(
            JSON.stringify({
                _id: chosenUser?._id,
                fullName: chosenUser?.fullName,
                jobTitle: chosenUser?.jobTitle,
                hierarchy: chosenUser?.hierarchy,
                mail: chosenUser?.mail,
            }),
        );

        console.log({ chosenUser });

        setInputValue('');
    };

    console.log({ value });

    const handleEntityInputChange = (_event: React.SyntheticEvent, newDisplayValue: string) => setInputValue(newDisplayValue);

    const handleBlur = () => onBlur(id, inputValue);

    return (
        <Grid>
            <AvatarGroup max={5}>
                {value.map(
                    (user) =>
                        user.fullName && (
                            <Grid key={user._id}>
                                <MeltaTooltip title={user.fullName}>
                                    <Grid>
                                        <UserAvatar user={user} size={25} bgColor="1E2775" />
                                    </Grid>
                                </MeltaTooltip>
                            </Grid>
                        ),
                )}
            </AvatarGroup>
            <UserAutocomplete
                {...widgetProps}
                mode="external"
                value={null}
                label={label}
                onChange={handleUserChange}
                onDisplayValueChange={handleEntityInputChange}
                displayValue={inputValue}
                isError={rawErrors.length > 0}
                onBlur={handleBlur}
                disabled={disabled}
            />
        </Grid>
    );
};

export default RjfsUserWidget;
