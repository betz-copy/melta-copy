import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Close';
import {
    Autocomplete,
    Button,
    Card,
    CardContent,
    CardHeader,
    Collapse,
    Dialog,
    Divider,
    Grid,
    IconButton,
    TextField,
    Typography,
    styled,
} from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React, { useMemo, useRef } from 'react';
import { useQueryClient } from 'react-query';
import { AppRegistration } from '@mui/icons-material';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { PermissionScope } from '../../../interfaces/permissions';
import { IReferencedEntityForProcess } from '../../../interfaces/processes/processInstance';
import { useUserStore } from '../../../stores/user';
import { ProcessDetailsValues } from './ProcessDetails';
import { ProcessStepValues } from './ProcessSteps';
import UnknownEntityCard from './UnknownEntityCard';
import { checkUserTemplatePermission } from '../../../utils/permissions/instancePermissions';
import OpenEntityReference from './ProcessDetails/OpenEntityReference';
import { EntityReference } from './EntityReference';
import EntitiesTableOfTemplateWithQuickFilter from '../../inputs/TemplateTableSelect/EntitiesTableOfTemplateWithQuickFilter';
import { AddEntityButton } from '../../EntitiesPage/Buttons/AddEntity';
import { CustomIcon } from '../../CustomIcon';
import { getEntityTemplateColor, hexToRgba } from '../../../utils/colors';

type ProcessFormikProps = ProcessStepValues | ProcessDetailsValues;
interface ChooseEntityReferenceProps {
    field: string;
    values: FormikProps<ProcessFormikProps>['values'];
    errors: FormikProps<ProcessFormikProps>['errors'];
    touched: FormikProps<ProcessFormikProps>['touched'];
    setFieldValue: FormikProps<ProcessFormikProps>['setFieldValue'];
    handleBlur: FormikProps<ProcessFormikProps>['handleBlur'];
    isViewMode: boolean;
    title: string;
    errorText: string | null;
    displaySmallField?: boolean;
}

const CardFieldName = styled(Typography)(({ theme }) => ({
    top: '8px',
    left: '20px',
    hight: '3px',
    position: 'relative',
    width: 'fit-content',
    fontSize: '11px',
    letterSpacing: '1px',
    background: theme.palette.mode === 'light' ? 'white' : '#383838',
    paddingRight: 1,
    paddingLeft: 1,
    color: theme.palette.mode === 'light' ? 'gray' : 'whitesmoke',
    borderRadius: 10,
}));

export const EntityReferenceField: React.FC<ChooseEntityReferenceProps> = ({
    field,
    values,
    errors,
    touched,
    setFieldValue,
    handleBlur,
    isViewMode,
    title,
    errorText,
    displaySmallField = false,
}) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const ref = useRef(null);

    const currentUser = useUserStore((state) => state.user);

    const activeEntityTemplatesFiltered: IMongoEntityTemplatePopulated[] = useMemo(() => {
        return Array.from(entityTemplates.values())
            .filter((entity) =>
                checkUserTemplatePermission(currentUser.currentWorkspacePermissions, entity.category._id, entity._id, PermissionScope.write),
            )
            .filter((entity) => !entity.disabled);
    }, [entityTemplates, currentUser.currentWorkspacePermissions]);

    const [isChooseTemplateOpen, setIsChooseTemplateOpen] = React.useState<boolean>(false);
    const [isChooseExistEntityOpen, setIsChooseExistEntityOpen] = React.useState<boolean>(false);

    const referencedEntityData = (values.entityReferences[field] as IReferencedEntityForProcess) ?? null;

    const userHasPermissions = !referencedEntityData?.entityTemplate
        ? undefined
        : checkUserTemplatePermission(
              currentUser.currentWorkspacePermissions,
              referencedEntityData?.entityTemplate.category._id,
              referencedEntityData?.entityTemplate._id,
              PermissionScope.read,
          );

    const disabled = !referencedEntityData?.entityTemplate || userHasPermissions === false;

    const handleRemoveEntity = (event) => {
        setTimeout(() => {
            setIsChooseTemplateOpen(false);
            setFieldValue(`entityReferences.${field}`, null);
            setFieldValue(`entityReferences.${field}.entityTemplate`, null);
            handleBlur(`entityReferences.${field}`)(event);
        }, 500);
    };

    if (typeof values.entityReferences[field] === 'string') {
        return (
            <>
                <CardFieldName>{title}</CardFieldName>
                <UnknownEntityCard
                    customActionButton={
                        isViewMode
                            ? undefined
                            : {
                                  onClick: handleRemoveEntity,
                                  icon: <RemoveIcon />,
                                  popoverText: i18next.t('wizard.processInstance.changeEntity'),
                              }
                    }
                    customCardStyle={{
                        background: 'transparent',
                    }}
                />
            </>
        );
    }

    return (
        <Grid paddingBottom={2} height="100%">
            <Typography color="#9398C2" fontSize="14px">
                {title}
            </Typography>
            <Collapse
                in={(!referencedEntityData || !referencedEntityData.entity) && !isViewMode}
                {...(referencedEntityData?.entity ? { timeout: 250 } : {})}
                mountOnEnter
                unmountOnExit
                ref={ref}
            >
                {!isChooseTemplateOpen && (
                    <Button
                        onClick={() => {
                            setIsChooseTemplateOpen(true);
                        }}
                        startIcon={<AddIcon style={{ fontSize: '25px' }} />}
                        size="large"
                    >
                        <Typography fontSize="15px">{i18next.t('processInstancesPage.entityToRef')}</Typography>
                    </Button>
                )}
                {isChooseTemplateOpen && (
                    <Grid
                        container
                        width="100%"
                        height="80px"
                        alignItems="center"
                        paddingX="20px"
                        sx={{ backgroundColor: '#F2F4FA66', borderRadius: '10px' }}
                    >
                        <Grid width="40%" alignItems="center">
                            <Autocomplete
                                id="entityTemplate"
                                options={activeEntityTemplatesFiltered}
                                onChange={(_e, value: IMongoEntityTemplatePopulated | null) => {
                                    setFieldValue(`entityReferences.${field}.entityTemplate`, value);
                                    setFieldValue(`entityReferences.${field}.userHavePermission`, true);
                                }}
                                value={referencedEntityData?.entityTemplate ?? null}
                                getOptionLabel={(option) => option.displayName}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        name="template"
                                        variant="outlined"
                                        sx={{ backgroundColor: '#FFFFFF' }}
                                        label={i18next.t('entityTemplate')}
                                    />
                                )}
                            />
                        </Grid>
                        {referencedEntityData?.entityTemplate && (
                            <Grid container width="60%" height="100%" justifyContent="space-around" alignItems="center">
                                <Grid height="100%" alignContent="center">
                                    <Divider orientation="vertical" variant="middle" sx={{ height: '60%', width: '10px' }} />
                                </Grid>
                                <Grid>
                                    <Button
                                        onClick={() => {
                                            setIsChooseExistEntityOpen(true);
                                        }}
                                        variant="text"
                                        size="medium"
                                        sx={{ backgroundColor: '#EBEFFA', paddingX: '20px', borderRadius: '7px' }}
                                    >
                                        <Typography fontSize="15px" color="#1E2775">
                                            {i18next.t('processInstancesPage.chooseEntityRef')}
                                        </Typography>
                                    </Button>
                                </Grid>
                                <Grid>
                                    <Typography color="#9398C2" fontSize="15px">
                                        {i18next.t('input.imagePicker.or')}
                                    </Typography>
                                </Grid>
                                <Grid>
                                    <AddEntityButton
                                        initialStep={1}
                                        disabled={disabled}
                                        popoverText=""
                                        initialValues={{
                                            template: referencedEntityData?.entityTemplate,
                                            properties: { disabled: false },
                                            attachmentsProperties: {},
                                        }}
                                        style={{ backgroundColor: '#EBEFFA', borderRadius: '7px', paddingRight: '20px', paddingLeft: '20px' }}
                                        onSuccessCreate={(value) => {
                                            setFieldValue(`entityReferences.${field}.entity`, value);
                                        }}
                                    >
                                        <Typography fontSize="15px" color="#1E2775">
                                            {i18next.t('processInstancesPage.createNewEntityRef')}
                                        </Typography>
                                    </AddEntityButton>
                                </Grid>
                            </Grid>
                        )}
                    </Grid>
                )}
            </Collapse>
            <Dialog open={isChooseExistEntityOpen} onClose={() => setIsChooseExistEntityOpen(false)} maxWidth="lg">
                <Card sx={{ width: 700 }}>
                    <CardHeader
                        action={
                            <IconButton
                                onClick={() => {
                                    setIsChooseExistEntityOpen(false);
                                }}
                            >
                                <RemoveIcon />
                            </IconButton>
                        }
                    />

                    <CardContent>
                        <EntitiesTableOfTemplateWithQuickFilter
                            entityTemplate={referencedEntityData?.entityTemplate}
                            onRowSelected={(value) => {
                                setFieldValue(`entityReferences.${field}.entity`, value);
                                setIsChooseExistEntityOpen(false);
                                setIsChooseTemplateOpen(false);
                            }}
                            hideNonPreview
                        />
                    </CardContent>
                </Card>
            </Dialog>

            {referencedEntityData?.entity && entityTemplates.get(referencedEntityData.entity.templateId) && (
                // TODO: handle required fields in general fields, and entity ref field required field errors....

                <Grid height="100%">
                    <OpenEntityReference
                        key={field}
                        errors={errors}
                        fieldName={field}
                        handleBlur={handleBlur}
                        setFieldValue={setFieldValue}
                        title={title}
                        touched={touched}
                        values={values}
                        viewMode
                    >
                        {displaySmallField ? (
                            <Grid
                                container
                                height="25px"
                                sx={{
                                    backgroundColor: hexToRgba(
                                        getEntityTemplateColor(entityTemplates.get(referencedEntityData.entity.templateId)!),
                                        0.2,
                                    ),
                                    borderRadius: '5px',
                                    paddingX: '10px',
                                    cursor: 'pointer',
                                }}
                                width="fit-content"
                                alignItems="center"
                                gap="10px"
                            >
                                <Grid alignContent="center" alignSelf="center" alignItems="center">
                                    {entityTemplates.get(referencedEntityData.entity.templateId)?.iconFileId ? (
                                        <CustomIcon
                                            iconUrl={entityTemplates.get(referencedEntityData.entity.templateId)!.iconFileId || ''}
                                            height="15px"
                                            width="15px"
                                        />
                                    ) : (
                                        <AppRegistration fontSize="small" height="15px" width="15px" />
                                    )}
                                </Grid>
                                <Grid>
                                    <Typography
                                        align="center"
                                        fontSize="12px"
                                        color={getEntityTemplateColor(entityTemplates.get(referencedEntityData.entity.templateId)!)}
                                    >
                                        {entityTemplates.get(referencedEntityData.entity.templateId)?.displayName}
                                    </Typography>
                                </Grid>
                            </Grid>
                        ) : (
                            <EntityReference
                                field={field}
                                values={values}
                                setFieldValue={setFieldValue}
                                isDialogMode={false}
                                editMode={!isViewMode}
                            />
                        )}
                    </OpenEntityReference>
                </Grid>
            )}
            {!referencedEntityData && isViewMode && (
                <Grid>
                    <Typography display="inline" variant="h6">
                        -
                    </Typography>
                </Grid>
            )}
            {errorText && <Typography color="error">{errorText}</Typography>}
        </Grid>
    );
};