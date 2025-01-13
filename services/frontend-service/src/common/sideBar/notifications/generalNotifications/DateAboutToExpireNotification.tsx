import React from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { IEntityTemplateMap, IDateAboutToExpireMetadataPopulated } from '@microservices/shared-interfaces';
import { EntityLink } from '../../../EntityLink';

export const DateAboutToExpireNotification: React.FC<{ notificationMetadata: IDateAboutToExpireMetadataPopulated }> = ({
    notificationMetadata: { entity, propertyName, datePropertyValue },
}) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const entityTemplate = entity ? entityTemplates.get(entity.templateId)! : null;
    return (
        <Grid container direction="column" spacing={1}>
            <Grid item>
                <Typography display="inline">{`${i18next.t('dateAboutToExpireNotification.propertyValue')} `}</Typography>
                <Typography display="inline" fontWeight="bold">
                    {new Date(datePropertyValue).toLocaleDateString('he-IL')}
                </Typography>
                <Typography display="inline" fontWeight="bold">
                    {` (${entityTemplate?.properties.properties[propertyName].title}) `}
                </Typography>
                <Typography display="inline">{` ${i18next.t('dateAboutToExpireNotification.entityTemplateName')} `} </Typography>
                <EntityLink entity={entity} entityTemplate={entityTemplate} />
                <Typography display="inline">{` ${i18next.t('dateAboutToExpireNotification.aboutToExpire')} `} </Typography>
            </Grid>
        </Grid>
    );
};
