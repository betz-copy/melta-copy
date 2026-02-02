import { AppRegistration } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Grid, IconButton, Typography } from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React from 'react';
import { useQueryClient } from 'react-query';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { PermissionScope } from '../../../interfaces/permissions';
import { IReferencedEntityForProcess } from '../../../interfaces/processes/processInstance';
import { useUserStore } from '../../../stores/user';
import { getEntityTemplateColor } from '../../../utils/colors';
import { checkUserTemplatePermission } from '../../../utils/permissions/instancePermissions';
import { CustomIcon } from '../../CustomIcon';
import { EntityPropertiesInternal } from '../../EntityProperties';
import { EntityTemplateColor } from '../../EntityTemplateColor';
import type { ProcessDetailsValues } from './ProcessDetails';
import type { ProcessStepValues } from './ProcessSteps';

type ProcessFormikProps = ProcessStepValues | ProcessDetailsValues;
interface ChooseEntityReferenceProps {
    field: string;
    values: FormikProps<ProcessFormikProps>['values'];
    displayFullEntity?: boolean;
    setFieldValue: FormikProps<ProcessFormikProps>['setFieldValue'];
    editMode?: boolean;
    isDialogMode?: boolean;
}

export const EntityReference: React.FC<ChooseEntityReferenceProps> = ({
    field,
    values,
    displayFullEntity,
    setFieldValue,
    editMode = false,
    isDialogMode = true,
}) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const currentUser = useUserStore((state) => state.user);

    const referencedEntityData = (values.entityReferences[field] as IReferencedEntityForProcess) ?? null;

    const fieldsToDisplay = !displayFullEntity
        ? entityTemplates.get(referencedEntityData.entity.templateId)!.propertiesPreview.slice(0, 5)
        : undefined;

    return (
        <Grid paddingBottom={2} height="100%">
            {referencedEntityData?.entity && (
                <Grid height="100%">
                    {checkUserTemplatePermission(
                        currentUser.currentWorkspacePermissions,
                        entityTemplates.get(referencedEntityData.entity.templateId)!.category._id,
                        referencedEntityData.entity.templateId,
                        PermissionScope.read,
                    ) ? (
                        <Grid
                            container
                            flexDirection="row"
                            justifyContent="space-between"
                            style={{ backgroundColor: '#F2F4FA66' }}
                            height="100%"
                            paddingX="20px"
                            paddingY="10px"
                            borderRadius="10px"
                        >
                            <Grid height="100%">
                                <EntityTemplateColor
                                    entityTemplateColor={getEntityTemplateColor(entityTemplates.get(referencedEntityData.entity.templateId)!)}
                                    style={{ height: '100%', width: '7px' }}
                                />
                            </Grid>
                            <Grid container flexDirection="column" width="95%" height="100%" flexWrap="nowrap">
                                <Grid container justifyContent="space-between" flexWrap="nowrap">
                                    <Grid container gap="20px" flexWrap="nowrap">
                                        <Grid>
                                            {entityTemplates.get(referencedEntityData.entity.templateId)?.iconFileId ? (
                                                <CustomIcon
                                                    iconUrl={entityTemplates.get(referencedEntityData.entity.templateId)!.iconFileId || ''}
                                                    height="24px"
                                                    width="24px"
                                                />
                                            ) : (
                                                <AppRegistration fontSize="small" />
                                            )}
                                        </Grid>
                                        <Grid>
                                            <Typography
                                                style={{
                                                    fontWeight: 'bold',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    width: '130px',
                                                }}
                                            >
                                                {entityTemplates.get(referencedEntityData.entity.templateId)!.displayName || ''}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    {!isDialogMode && (
                                        <Grid container width="70px" justifyContent="space-between" flexWrap="nowrap">
                                            <Grid>
                                                <IconButton sx={{ width: '30px', height: '30px' }}>
                                                    <VisibilityIcon sx={{ color: '#1E2775' }} />
                                                </IconButton>
                                            </Grid>
                                            <Grid
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                }}
                                            >
                                                <IconButton
                                                    sx={{ width: '30px', height: '30px' }}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        setFieldValue(`entityReferences.${field}`, null);
                                                    }}
                                                    disabled={!editMode}
                                                    onPointerDown={(e) => {
                                                        e.stopPropagation();
                                                    }}
                                                >
                                                    <CloseIcon sx={{ color: '#1E2775' }} />
                                                </IconButton>
                                            </Grid>
                                        </Grid>
                                    )}
                                </Grid>
                                <Grid width="100%" overflow={isDialogMode ? undefined : 'auto'}>
                                    <EntityPropertiesInternal
                                        properties={referencedEntityData.entity.properties}
                                        entityTemplate={entityTemplates.get(referencedEntityData.entity.templateId)!}
                                        style={{
                                            flexDirection: 'row',
                                            flexWrap: 'wrap',
                                            alignItems: isDialogMode ? undefined : 'center',
                                            width: '100%',
                                        }}
                                        innerStyle={{
                                            width: displayFullEntity || isDialogMode ? '50%' : '20%',
                                            color: 'red',
                                        }}
                                        overridePropertiesToShow={fieldsToDisplay}
                                        showPreviewPropertiesOnly={!displayFullEntity}
                                        textWrap={isDialogMode}
                                        mode="normal"
                                        propertiesToHighlightColor="red"
                                        propertiesToHighlight={[]}
                                        isPrintingMode={!isDialogMode}
                                    />
                                </Grid>
                                {Object.keys(referencedEntityData.entity.properties).length === 0 && (
                                    <Typography>{i18next.t('templateEntitiesAutocomplete.noPreviewFields')}</Typography>
                                )}
                            </Grid>
                        </Grid>
                    ) : (
                        <Typography>{i18next.t('systemManagement.entityInstanceReadDisabled')}</Typography>
                    )}
                </Grid>
            )}
        </Grid>
    );
};
