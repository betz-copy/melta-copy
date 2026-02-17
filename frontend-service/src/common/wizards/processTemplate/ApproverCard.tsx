import { Chip, Grid } from '@mui/material';
import { IPropertyValue } from '@packages/entity';
import { IUser } from '@packages/user';
import React from 'react';
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

    return (
        <Grid margin={1} sx={{ bgcolor: darkMode ? '#242424' : 'white' }}>
            {typeof user === 'string' ? (
                <Chip
                    label={user}
                    variant="outlined"
                    onDelete={readOnly ? undefined : () => remove(userIndex)}
                    key={user}
                    sx={{ background: darkMode ? '#1E1F2B' : '#EBEFFA', color: darkMode ? '#D3D6E0' : '#53566E' }}
                />
            ) : user ? (
                <UserAvatar
                    user={{ ...user, _id: user._id ?? (user as IPropertyValue).id }}
                    chip={{ onDelete: readOnly ? undefined : () => remove(userIndex) }}
                    key={user._id ?? (user as IPropertyValue).id}
                />
            ) : null}
        </Grid>
    );
};
export default CreateUserCard;
