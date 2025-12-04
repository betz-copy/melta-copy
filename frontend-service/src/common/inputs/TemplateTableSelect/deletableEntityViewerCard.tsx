import { AppRegistration as AppRegistrationIcon, Clear as ClearIcon } from '@mui/icons-material';
import { Card, CardContent, CardHeader, IconButton } from '@mui/material';
import React from 'react';
import { useQueryClient } from 'react-query';
import { IChildTemplateMap } from '../../../interfaces/childTemplates';
import { IEntity } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { useDarkModeStore } from '../../../stores/darkMode';
import { useUserStore } from '../../../stores/user';
import { useWorkspaceStore } from '../../../stores/workspace';
import { isEntityFitsToChildTemplate } from '../../../utils/childTemplates';
import { isWorkspaceAdmin } from '../../../utils/permissions/instancePermissions';
import { CustomIcon } from '../../CustomIcon';
import { EntityPropertiesInternal } from '../../EntityProperties';

const DeletableEntityViewerCard: React.FC<{ entity: IEntity; onDelete: () => void; childTemplateId?: string }> = ({ entity, onDelete }) => {
    const queryClient = useQueryClient();
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const workspace = useWorkspaceStore((state) => state.workspace);
    const currentUser = useUserStore((state) => state.user);
    const currentUserKartoffelId = currentUser?.kartoffelId;

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildTemplates')!;
    const childTemplatesOfParent = Array.from(childTemplates.values()).filter(({ parentTemplate: { _id } }) => entity.templateId === _id);

    const childTemplate = entity.childTemplateId
        ? childTemplates.get(entity.childTemplateId)
        : childTemplatesOfParent?.find((child) =>
              isEntityFitsToChildTemplate(
                  child,
                  !entityTemplates.get(entity.templateId),
                  entity.properties._id,
                  currentUserKartoffelId,
                  currentUser?.usersUnitsWithInheritance,
                  isWorkspaceAdmin(currentUser?.permissions?.[workspace._id]),
              ),
          );

    const entityTemplate = entityTemplates.get(entity.templateId) ?? childTemplate;

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
                slotProps={{ title: { variant: 'h4' } }}
            />
            <CardContent>
                {/* If no entityTemplate, didn't find template of entity in react-query state */}
                {!entityTemplate ? (
                    entity.properties._id
                ) : (
                    <EntityPropertiesInternal
                        properties={entity.properties}
                        coloredFields={entity.coloredFields}
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
