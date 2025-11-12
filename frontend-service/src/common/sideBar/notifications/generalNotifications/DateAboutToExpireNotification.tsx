import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useQueryClient } from 'react-query';
import { environment } from '../../../../globals';
import { IEntityTemplateMap } from '../../../../interfaces/entityTemplates';
import { IDateAboutToExpireMetadataPopulated, NotificationType } from '../../../../interfaces/notifications';
import { EntityLink } from '../../../EntityLink';
import { NotificationColor } from '../../../notificationColor';

export const DateAboutToExpireNotification: React.FC<{ notificationMetadata: IDateAboutToExpireMetadataPopulated }> = ({
    notificationMetadata: { entity, propertyName, datePropertyValue },
}) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const entityTemplate = entity ? entityTemplates.get(entity.templateId) : null;
    const { notificationsMoreData } = environment.notifications;
    const color = notificationsMoreData.general.find((notificationData) => notificationData.type === NotificationType.dateAboutToExpire)?.color;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const datePast = new Date(datePropertyValue) < today;

    return (
        <Grid container direction="column" spacing={1}>
            <Grid container>
                <NotificationColor color={color!} />
                <Typography display="inline" color="primary" fontWeight="bold" paddingLeft="10px">
                    {datePast ? i18next.t('dateAboutToExpireNotification.datePast') : i18next.t('dateAboutToExpireNotification.dateAboutToExpire')}
                </Typography>
            </Grid>
            <Grid>
                <Typography display="inline">{`${i18next.t('dateAboutToExpireNotification.propertyValue')} `}</Typography>
                <Typography display="inline" fontWeight="bold">
                    {new Date(datePropertyValue).toLocaleDateString('he-IL')}
                </Typography>
                <Typography display="inline" fontWeight="bold">
                    {` (${entityTemplate?.properties.properties[propertyName].title}) `}
                </Typography>
                <Typography display="inline">{` ${i18next.t('dateAboutToExpireNotification.entityTemplateName')} `} </Typography>
                <EntityLink entity={entity} entityTemplate={entityTemplate ?? null} />
                <Typography display="inline">{` ${i18next.t(`dateAboutToExpireNotification.${datePast ? 'past' : 'aboutToExpire'}`)} `}</Typography>
            </Grid>
        </Grid>
    );
};
