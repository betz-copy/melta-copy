/* eslint-disable react/no-array-index-key */
import React from 'react';
import { Chip, Grid } from '@mui/material';
import _debounce from 'lodash.debounce';
import { useDarkModeStore } from '../../../stores/darkMode';

interface ApproverCard {
    userName: string | undefined;
    remove: <T>(index: number) => T | undefined;
    userIndex: number;
    readOnly?: boolean;
}
const CreateUserCard: React.FC<ApproverCard> = ({ userName, remove, userIndex, readOnly = false }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <Grid margin={1} sx={{ bgcolor: darkMode ? '#242424' : 'white' }}>
            <Chip label={userName} variant="outlined" onDelete={readOnly ? undefined : () => remove(userIndex)} />
        </Grid>
    );
};
export default CreateUserCard;
