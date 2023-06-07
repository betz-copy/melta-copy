/* eslint-disable react/no-array-index-key */
import React from 'react';
import { Chip, Grid } from '@mui/material';
import _debounce from 'lodash.debounce';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';

interface ApproverCard {
    userName: string | undefined;
    remove: <T>(index: number) => T | undefined;
    userIndex: number;
}
const CreateUserCard: React.FC<ApproverCard> = ({ userName, remove, userIndex }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);
    return (
        <Grid margin={1} sx={{ bgcolor: darkMode ? '#242424' : 'white' }}>
            <Chip
                label={userName}
                variant="outlined"
                onDelete={() => remove(userIndex)}
            />
        </Grid>
    );
};
export default CreateUserCard;
