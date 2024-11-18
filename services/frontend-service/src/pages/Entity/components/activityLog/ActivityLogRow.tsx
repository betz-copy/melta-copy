import React from 'react';
import { Typography, Grid, Skeleton } from '@mui/material';
import { useQuery } from 'react-query';
import randomColor from 'randomcolor';
import { IMongoEntityTemplatePopulated } from '@microservices/shared';
import { IActivityLog } from '../../../../services/activityLogService';
import { getUserByIdRequest } from '../../../../services/userService';
import ActionText from './ActionText';
import { getShortDate } from '../../../../utils/date';
import UserAvatar from '../../../../common/UserAvatar';
import { useDarkModeStore } from '../../../../stores/darkMode';

const ActivityLogRow: React.FC<{ log: IActivityLog; entityTemplate: IMongoEntityTemplatePopulated }> = ({ log, entityTemplate }) => {
    const { data: user, isLoading } = useQuery(['getUserById', log.userId], () => getUserByIdRequest(log.userId));

    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <Grid container>
            <Grid item padding="10px">
                {isLoading ? (
                    <Skeleton variant="circular" width={40} height={40} />
                ) : (
                    <UserAvatar user={user!} size={40} bgColor={randomColor({ luminosity: 'dark', seed: user!._id })} />
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
                            <Typography variant="subtitle1" color={darkMode ? 'lightgray' : 'gray'} fontFamily="Rubik" fontSize="15px">
                                {getShortDate(log.timestamp)}
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
