import { AppRegistration } from '@mui/icons-material';
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
    styled,
    TextField,
    Typography,
} from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from 'react-query';
import { environment } from '../../../globals';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { PermissionScope } from '../../../interfaces/permissions';
import { IReferencedEntityForProcess } from '../../../interfaces/processes/processInstance';
import { useUserStore } from '../../../stores/user';
import { getEntityTemplateColor, hexToRgba } from '../../../utils/colors';
import { checkUserTemplatePermission } from '../../../utils/permissions/instancePermissions';
import { CustomIcon } from '../../CustomIcon';
import { AddEntityButton } from '../../EntitiesPage/Buttons/AddEntity';
import EntitiesTableOfTemplateWithQuickFilter from '../../inputs/TemplateTableSelect/EntitiesTableOfTemplateWithQuickFilter';
import { EntityReference } from './EntityReference';
import { ProcessDetailsValues } from './ProcessDetails';
import OpenEntityReference from './ProcessDetails/OpenEntityReference';
import { ProcessStepValues } from './ProcessSteps';
import UnknownEntityCard from './UnknownEntityCard';

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
    height: '3px',
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

    type Mode = 'idle' | 'chooseTemplate' | 'chooseEntity';
    const [chooseMode, setChooseMode] = useState<Mode>('idle');

    const referencedEntityData = (values.entityReferences[field] as IReferencedEntityForProcess) ?? null;

    const referencedEntityTemplate = entityTemplates.get(referencedEntityData.entity.templateId);

    const userHasPermissions = !referencedEntityData?.entityTemplate
        ? undefined
        : checkUserTemplatePermission(
              currentUser.currentWorkspacePermissions,
              referencedEntityData?.entityTemplate.category._id,
              referencedEntityData?.entityTemplate._id,
              PermissionScope.read,
          );

    const canCreateEntity = Boolean(referencedEntityData?.entityTemplate) && userHasPermissions === true;

    const handleRemoveEntity = (event: React.MouseEvent) => {
        setChooseMode('idle');
        setFieldValue(`entityReferences.${field}`, null);
        handleBlur(`entityReferences.${field}`)(event);
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
            <Typography color={environment.entityReferenceField.titleColor} fontSize="14px">
                {title}
            </Typography>
            <Collapse
                in={(!referencedEntityData || !referencedEntityData.entity) && !isViewMode}
                {...(referencedEntityData?.entity ? { timeout: 250 } : {})}
                mountOnEnter
                unmountOnExit
                ref={ref}
            >
                {chooseMode !== 'chooseTemplate' && (
                    <Button
                        onClick={() => {
                            setChooseMode('chooseTemplate');
                        }}
                        startIcon={<AddIcon style={{ fontSize: '25px' }} />}
                        size="large"
                    >
                        <Typography variant="body1">{i18next.t('processInstancesPage.entityToRef')}</Typography>
                    </Button>
                )}
                {chooseMode === 'chooseTemplate' && (
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
                                            setChooseMode('chooseEntity');
                                        }}
                                        variant="text"
                                        size="medium"
                                        sx={{
                                            backgroundColor: environment.entityReferenceField.backgroundColor,
                                            paddingX: '20px',
                                            borderRadius: '7px',
                                        }}
                                    >
                                        <Typography variant="body1" color={environment.entityReferenceField.textColor}>
                                            {i18next.t('processInstancesPage.chooseEntityRef')}
                                        </Typography>
                                    </Button>
                                </Grid>
                                <Grid>
                                    <Typography variant="body1" color={environment.entityReferenceField.titleColor}>
                                        {i18next.t('input.imagePicker.or')}
                                    </Typography>
                                </Grid>
                                <Grid>
                                    <AddEntityButton
                                        initialStep={1}
                                        disabled={!canCreateEntity}
                                        popoverText=""
                                        initialValues={{
                                            template: referencedEntityData?.entityTemplate,
                                            properties: { disabled: false },
                                            attachmentsProperties: {},
                                        }}
                                        style={{
                                            backgroundColor: environment.entityReferenceField.backgroundColor,
                                            borderRadius: '7px',
                                            paddingRight: '20px',
                                            paddingLeft: '20px',
                                        }}
                                        onSuccessCreate={(value) => {
                                            setFieldValue(`entityReferences.${field}.entity`, value);
                                        }}
                                    >
                                        <Typography variant="body1" color={environment.entityReferenceField.textColor}>
                                            {i18next.t('processInstancesPage.createNewEntityRef')}
                                        </Typography>
                                    </AddEntityButton>
                                </Grid>
                            </Grid>
                        )}
                    </Grid>
                )}
            </Collapse>
            <Dialog open={chooseMode === 'chooseEntity'} onClose={() => setChooseMode('idle')} maxWidth="lg">
                <Card sx={{ width: 700 }}>
                    <CardHeader
                        action={
                            <IconButton
                                onClick={() => {
                                    setChooseMode('idle');
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
                                setChooseMode('idle');
                            }}
                            hideNonPreview
                        />
                    </CardContent>
                </Card>
            </Dialog>

            {referencedEntityData?.entity && referencedEntityTemplate && (
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
                                sx={{
                                    backgroundColor: hexToRgba(getEntityTemplateColor(referencedEntityTemplate!), 0.2),
                                    borderRadius: '5px',
                                    paddingX: '10px',
                                    cursor: 'pointer',
                                }}
                                width="fit-content"
                                alignItems="center"
                                gap="10px"
                            >
                                <Grid alignContent="center" alignSelf="center" alignItems="center">
                                    {referencedEntityTemplate?.iconFileId ? (
                                        <CustomIcon
                                            style={{ marginTop: '5px' }}
                                            iconUrl={referencedEntityTemplate!.iconFileId || ''}
                                            height="15px"
                                            width="15px"
                                        />
                                    ) : (
                                        <AppRegistration style={{ marginTop: '5px' }} fontSize="small" height="15px" width="15px" />
                                    )}
                                </Grid>
                                <Grid>
                                    <Typography align="center" fontSize="12px" color={getEntityTemplateColor(referencedEntityTemplate!)}>
                                        {referencedEntityTemplate?.displayName}
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
