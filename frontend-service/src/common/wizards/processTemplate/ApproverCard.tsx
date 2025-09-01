/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-array-index-key */
import { Chip, Grid } from '@mui/material';
import React from 'react';
import { IUser } from '../../../interfaces/users';
import { useDarkModeStore } from '../../../stores/darkMode';
import UserAvatar from '../../UserAvatar';

interface ApproverCard {
    user: string | IUser | undefined;
    remove: <T>(index: number) => T | undefined;
    userIndex: number;
    readOnly?: boolean;
}
const CreateUserCard: React.FC<ApproverCard> = ({ user, remove, userIndex, readOnly = false }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const chipSx = { background: darkMode ? '#1E1F2B' : '#EBEFFA', color: darkMode ? '#D3D6E0' : '#53566E' };

    return (
        <Grid margin={1} sx={{ bgcolor: darkMode ? '#242424' : 'white' }}>
            {typeof user === 'string' ? (
                <Chip label={user} variant="outlined" onDelete={readOnly ? undefined : () => remove(userIndex)} key={user} sx={chipSx} />
            ) : user ? (
                <Chip
                    avatar={<UserAvatar user={user} size={25} overrideSx={{ border: '1.3px solid #FF006B' }} />}
                    sx={chipSx}
                    label={user.fullName}
                    onDelete={readOnly ? undefined : () => remove(userIndex)}
                    key={user._id}
                />
            ) : null}
        </Grid>
    );
};
export default CreateUserCard;
