import { Divider, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { IUserPopulated } from '../../../interfaces/users';
import { useWorkspaceStore } from '../../../stores/workspace';

const UserDetails: React.FC<{ existingUser: IUserPopulated; editProfile: boolean }> = ({ existingUser, editProfile }) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const role = existingUser.roles?.find((role) => role.permissions[workspace._id]);

    const userDetailsMap: { [key: string]: string | boolean | undefined } = {
        fullName: existingUser.fullName,
        email: existingUser.mail,
        jobTitle: existingUser.jobTitle,
        hierarchy: existingUser.hierarchy,
        ...(role && { role: role.name }),
    };

    return (
        <Grid container gap={editProfile ? 1.5 : 2}>
            <Grid size={{ xs: 12 }}>
                <Divider />
            </Grid>
            {Object.entries(userDetailsMap).map(([key, value]) => (
                <Grid container key={key} gap={editProfile ? 1.5 : 2} size={{ xs: 12 }}>
                    <Grid display="flex" justifyContent="space-between" width="100%" paddingX="10px">
                        <Typography variant="body1" style={{ fontWeight: 'bold' }}>
                            {i18next.t(`user.${key}`)}
                        </Typography>
                        <Typography variant="body1">{String(value)}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Divider />
                    </Grid>
                </Grid>
            ))}
        </Grid>
    );
};
export { UserDetails };
