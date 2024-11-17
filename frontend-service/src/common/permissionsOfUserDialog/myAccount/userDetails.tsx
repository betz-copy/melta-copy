import { Divider, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { IUser } from '../../../interfaces/users';

const UserDetails: React.FC<{ existingUser: IUser }> = ({ existingUser }) => {
    const userDetailsMap: { [key: string]: string | boolean | undefined } = {
        fullName: existingUser.fullName,
        email: existingUser.mail,
        jobTitle: existingUser.jobTitle,
        hierarchy: existingUser.hierarchy,
    };
    return (
        <>
            {Object.entries(userDetailsMap).map(([key, value]) => (
                <>
                    <Grid item xs={6}>
                        <Typography variant="body1" style={{ fontWeight: 'bold' }}>
                            {i18next.t(`user.${key}`)}
                        </Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="body1">{String(value)}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Divider />
                    </Grid>
                </>
            ))}
        </>
    );
};
export { UserDetails };
