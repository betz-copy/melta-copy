/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-array-index-key */
import React from 'react';
import { Chip, Grid } from '@mui/material';
import _debounce from 'lodash.debounce';
import { useDarkModeStore } from '../../../stores/darkMode';
import { IUser } from '../../../interfaces/users';
import UserAvatar from '../../UserAvatar';

interface ApproverCard {
    user: string | IUser | undefined;
    remove: <T>(index: number) => T | undefined;
    userIndex: number;
    readOnly?: boolean;
}
const CreateUserCard: React.FC<ApproverCard> = ({ user, remove, userIndex, readOnly = false }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <Grid margin={1} sx={{ bgcolor: darkMode ? '#242424' : 'white' }}>
            {typeof user === 'string' ? (
                <Chip label={user} variant="outlined" onDelete={readOnly ? undefined : () => remove(userIndex)} key={user} />
            ) : user ? (
                <Chip
                    avatar={<UserAvatar user={user} size={25} bgColor="1E2775" />}
                    label={user.fullName}
                    onDelete={readOnly ? undefined : () => remove(userIndex)}
                    key={user._id}
                />
            ) : null}
        </Grid>
    );
};
export default CreateUserCard;
