import React from 'react';
import { Typography, Grid, Avatar, Skeleton } from '@mui/material';
import { useQuery } from 'react-query';
import randomColor from 'randomcolor';
import { IActivityLog } from '../../../services/activityLogService';
import { getUserByIdRequest } from '../../../services/kartoffelService';
import ActionText from './ActionText';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';

const ActivityLogRow: React.FC<{ log: IActivityLog; entityTemplate: IMongoEntityTemplatePopulated }> = ({ log, entityTemplate }) => {
    const { data: user, isLoading } = useQuery(['getUserById', log.userId], () => getUserByIdRequest(log.userId));

    return (
        <Grid container>
            <Grid item paddingLeft="10px" paddingRight="10px">
                {isLoading ? (
                    <Skeleton variant="circular" width={40} height={40} />
                ) : (
                    <Avatar
                        sx={{
                            font: '20px Rubik',
                            backgroundColor: randomColor({ luminosity: 'dark', seed: user!.firstName + user!.id }),
                            fontWeight: 500,
                            marginTop: '10px',
                        }}
                    >
                        {user!.firstName.charAt(0)}
                        {user!.lastName.charAt(0)}
                    </Avatar>
                )}
            </Grid>
            <Grid item container xs={9}>
                <Grid item container justifyContent="space-between" width="15vw">
                    <Grid item xs>
                        {isLoading ? (
                            <Skeleton variant="text" width="7vw" />
                        ) : (
                            <Typography variant="subtitle1" fontSize="15px" fontFamily="Rubik" fontWeight="500">
                                {user?.fullName}
                            </Typography>
                        )}
                    </Grid>
                    <Grid item>
                        {isLoading ? (
                            <Skeleton variant="text" width="5vw" />
                        ) : (
                            <Typography variant="subtitle1" color="rgb(110 104 104 / 87%)" fontFamily="Rubik" fontSize="15px">
                                {new Date(log.timestamp).toLocaleString('en-uk', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </Typography>
                        )}
                    </Grid>
                </Grid>

                <Grid item container marginTop="-3px">
                    {isLoading ? <Skeleton width="15vw" /> : <ActionText log={log} entityTemplate={entityTemplate} />}
                </Grid>
            </Grid>
        </Grid>
    );
};

export default ActivityLogRow;
