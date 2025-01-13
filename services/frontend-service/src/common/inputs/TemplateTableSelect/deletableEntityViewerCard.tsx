import React from 'react';
import { Card, CardContent, CardHeader, IconButton } from '@mui/material';
import { Clear as ClearIcon, AppRegistration as AppRegistrationIcon } from '@mui/icons-material';
import { useQueryClient } from 'react-query';
import { IEntity, IEntityTemplateMap } from '@microservices/shared-interfaces';
import { EntityPropertiesInternal } from '../../EntityProperties';
import { CustomIcon } from '../../CustomIcon';
import { useDarkModeStore } from '../../../stores/darkMode';

const DeletableEntityViewerCard: React.FC<{ entity: IEntity; onDelete: () => void }> = ({ entity, onDelete }) => {
    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const entityTemplate = entityTemplates.get(entity.templateId);

    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <Card variant="outlined" sx={{ overflowX: 'auto', maxWidth: '470px', backgroundColor: darkMode ? '#1e1e1e' : 'white' }}>
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
                {!entityTemplate ? (
                    entity.properties._id
                ) : (
                    <EntityPropertiesInternal
                        properties={entity.properties}
                        entityTemplate={entityTemplate}
                        darkMode={darkMode}
                        showPreviewPropertiesOnly
                        mode="normal"
                        viewFirstLineOfLongText
                    />
                )}
            </CardContent>
        </Card>
    );
};

export default DeletableEntityViewerCard;
