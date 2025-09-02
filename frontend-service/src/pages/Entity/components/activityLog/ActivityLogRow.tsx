import { Grid, Skeleton, Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useQuery } from 'react-query';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IProcessDetails } from '../../../../interfaces/processes/processTemplate';
import { IMongoStepTemplatePopulated } from '../../../../interfaces/processes/stepTemplate';
import { IActivityLog } from '../../../../services/activityLogService';
import { getUserByIdRequest } from '../../../../services/userService';
import { useDarkModeStore } from '../../../../stores/darkMode';
import { getShortDate } from '../../../../utils/date';
import ActionText from './ActionText';

const ActivityLogRow: React.FC<{
    log: IActivityLog;
    entityTemplate: IMongoEntityTemplatePopulated | IProcessDetails | IMongoStepTemplatePopulated;
}> = ({ log, entityTemplate }) => {
    const { data: user, isLoading } = useQuery(['getUserById', log.userId], () => getUserByIdRequest(log.userId));

    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <Grid container flexDirection="column" padding="15px">
            <Grid container size={{ xs: 9}}>
                <Grid container marginTop="-3px">
                    {isLoading ? <Skeleton width="15vw" /> : <ActionText log={log} entityTemplate={entityTemplate} />}
                </Grid>
            </Grid>
            <Grid container flexWrap="nowrap" justifyContent="space-between" alignItems="center" marginTop="10px">
                <Grid container spacing="5px">
                    <Grid>
                        <Typography variant="subtitle1" fontSize="12px" fontFamily="Rubik" fontWeight="400" color="#5A6173">
                            {i18next.t('entityPage.activityLog.by')}
                        </Typography>
                    </Grid>
                    <Grid>
                        {isLoading ? (
                            <Skeleton variant="text" width="7vw" />
                        ) : (
                            <Typography variant="subtitle1" fontSize="12px" fontFamily="Rubik" fontWeight="400" color="primary">
                                {user?.fullName}
                            </Typography>
                        )}
                    </Grid>
                </Grid>
                <Grid width="130px">
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
