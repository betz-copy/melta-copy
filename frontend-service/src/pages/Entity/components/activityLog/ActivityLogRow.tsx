import React from 'react';
import { Typography, Grid, Skeleton } from '@mui/material';
import { useQuery } from 'react-query';
import i18next from 'i18next';
import { IActivityLog } from '../../../../services/activityLogService';
import { getUserByIdRequest } from '../../../../services/userService';
import ActionText from './ActionText';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { getShortDate } from '../../../../utils/date';
import { useDarkModeStore } from '../../../../stores/darkMode';
import { IProcessDetails } from '../../../../interfaces/processes/processTemplate';
import { IMongoStepTemplatePopulated } from '../../../../interfaces/processes/stepTemplate';

const ActivityLogRow: React.FC<{
    log: IActivityLog;
    entityTemplate: IMongoEntityTemplatePopulated | IProcessDetails | IMongoStepTemplatePopulated;
}> = ({ log, entityTemplate }) => {
    const { data: user, isLoading } = useQuery(['getUserById', log.userId], () => getUserByIdRequest(log.userId));

    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <Grid container flexDirection="column" padding="15px">
            <Grid item container xs={9}>
                <Grid item container marginTop="-3px">
                    {isLoading ? <Skeleton width="15vw" /> : <ActionText log={log} entityTemplate={entityTemplate} />}
                </Grid>
            </Grid>
            <Grid item container flexWrap="nowrap" justifyContent="space-between" alignItems="center" marginTop="10px">
                <Grid item container spacing="5px">
                    <Grid item>
                        <Typography variant="subtitle1" fontSize="12px" fontFamily="Rubik" fontWeight="400" color="#5A6173">
                            {i18next.t('entityPage.activityLog.by')}
                        </Typography>
                    </Grid>
                    <Grid item>
                        {isLoading ? (
                            <Skeleton variant="text" width="7vw" />
                        ) : (
                            <Typography variant="subtitle1" fontSize="12px" fontFamily="Rubik" fontWeight="400" color="primary">
                                {user?.fullName}
                            </Typography>
                        )}
                    </Grid>
                </Grid>
                <Grid item width="120px">
                    {isLoading ? (
                        <Skeleton variant="text" width="5vw" />
                    ) : (
                        <Typography variant="subtitle1" color={darkMode ? 'lightgray' : '#5A6173'} fontFamily="Rubik" fontSize="11px">
                            {getShortDate(log.timestamp)}
                        </Typography>
                    )}
                </Grid>
            </Grid>
        </Grid>
    );
};

export default ActivityLogRow;
