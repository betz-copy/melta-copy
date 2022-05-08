import React from 'react';
import { Card, CardContent, CardHeader, IconButton } from '@mui/material';
import { Clear as ClearIcon, AppRegistration as AppRegistrationIcon } from '@mui/icons-material';
import { useQueryClient } from 'react-query';
import { IEntity } from '../../../interfaces/entities';
import { EntityProperties } from '../../EntityProperties';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { CustomIcon } from '../../CustomIcon';

const DeletableEntityViewerCard: React.FC<{ entity: IEntity; onDelete: () => void }> = ({ entity, onDelete }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!;
    const entityTemplate = entityTemplates.find((currEntityTemplate) => currEntityTemplate._id === entity.templateId);

    return (
        <Card variant="outlined">
            <CardHeader
                avatar={
                    entityTemplate?.iconFileId ? (
                        <CustomIcon iconUrl={entityTemplate.iconFileId} height="40px" width="40px" />
                    ) : (
                        <AppRegistrationIcon sx={{ fontSize: '40px' }} />
                    )
                }
                action={
                    <IconButton onClick={onDelete}>
                        <ClearIcon />
                    </IconButton>
                }
                title={entityTemplate?.displayName}
                titleTypographyProps={{ variant: 'h4' }}
            />
            <CardContent>
                {/* if no entityTemplate, didnt find template of entity in react-query state */}
                {!entityTemplate ? entity.properties._id : <EntityProperties entityTemplate={entityTemplate} properties={entity.properties} />}
            </CardContent>
        </Card>
    );
};

export default DeletableEntityViewerCard;
