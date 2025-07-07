import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Close';
import {
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Collapse,
    Grid,
    IconButton,
    Popover,
    Slide,
    TextField,
    Typography,
    styled,
} from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React, { useMemo, useState } from 'react';
import { useQueryClient } from 'react-query';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { PermissionScope } from '../../../interfaces/permissions';
import { IReferencedEntityForProcess } from '../../../interfaces/processes/processInstance';
import EntityCard from '../../../pages/GlobalSearch/components/entityCard';
import { useUserStore } from '../../../stores/user';
import TemplateTableSelect from '../../inputs/TemplateTableSelect';
import { ProcessDetailsValues } from './ProcessDetails';
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

export const EntityReference: React.FC<ChooseEntityReferenceProps> = ({
    field,
    values,
    errors,
    touched,
    setFieldValue,
    handleBlur,
    isViewMode,
    title,
    errorText,
}) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const currentUser = useUserStore((state) => state.user);

    const activeEntityTemplatesFiltered: IMongoEntityTemplatePopulated[] = useMemo(() => {
        return Array.from(entityTemplates.values())
            .filter((entity) => currentUser.currentWorkspacePermissions.instances?.categories[entity.category._id]?.scope === PermissionScope.write)
            .filter((entity) => !entity.disabled);
    }, [entityTemplates, currentUser.currentWorkspacePermissions]);

    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    const [chooseEntityAnchorEl, setChooseEntityAnchorEl] = useState<HTMLButtonElement | null>(null);

    const handleRemoveEntity = (event) => {
        setIsAnimatingOut(true);
        setTimeout(() => {
            setIsAnimatingOut(false);
            setFieldValue(`entityReferences.${field}`, null);
            handleBlur(`entityReferences.${field}`)(event);
            setChooseEntityAnchorEl(null);
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

    const referencedEntityData = (values.entityReferences[field] as IReferencedEntityForProcess) ?? null;

    return (
        <Grid paddingBottom={2}>
            <Collapse
                in={(!referencedEntityData || !referencedEntityData.entity) && !isViewMode}
                {...(referencedEntityData?.entity ? { timeout: 250 } : {})}
                mountOnEnter
                unmountOnExit
            >
                <Button
                    onClick={(event) => setChooseEntityAnchorEl(event.currentTarget)}
                    variant="outlined"
                    startIcon={<AddIcon style={{ fontSize: '27px' }} />}
                    size="large"
                >
                    {title}
                </Button>
            </Collapse>
            <Popover
                anchorEl={chooseEntityAnchorEl}
                open={Boolean(chooseEntityAnchorEl) && Boolean(!referencedEntityData?.entity)}
                anchorOrigin={{
                    vertical: 'center',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'center',
                    horizontal: 'center',
                }}
            >
                <Card sx={{ width: 700 }}>
                    <CardHeader
                        title={
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
                                    <TextField {...params} fullWidth name="template" variant="standard" label={i18next.t('entityTemplate')} />
                                )}
                            />
                        }
                        action={
                            <IconButton
                                onClick={(event) => {
                                    setChooseEntityAnchorEl(null);
                                    handleBlur(`entityReferences.${field}`)(event);
                                }}
                            >
                                <RemoveIcon />
                            </IconButton>
                        }
                    />

                    <CardContent>
                        <TemplateTableSelect
                            entityTemplate={referencedEntityData?.entityTemplate}
                            value={referencedEntityData?.entity}
                            onChange={(value) => {
                                setFieldValue(`entityReferences.${field}.entity`, value);
                                setChooseEntityAnchorEl(null);
                            }}
                            onBlur={(event) => {
                                handleBlur(`entityReferences.${field}`)(event);
                            }}
                            error={Boolean(touched[`entityReferences.${field}`] && errors[`entityReferences.${field}`])}
                            helperText={touched[`entityReferences.${field}`] ? errors[`entityReferences.${field}`] : ''}
                            label={i18next.t('wizard.processInstance.chooseRefEntity')}
                            autoLoad
                            hideNonPreview
                            checkUsersPermissions={PermissionScope.read}
                        />
                    </CardContent>
                </Card>
            </Popover>

            {referencedEntityData?.entity && (
                <Slide direction="left" in={!isAnimatingOut} timeout={1000} mountOnEnter unmountOnExit>
                    <Box marginTop="-20px" paddingBottom={1}>
                        <CardFieldName>{title}</CardFieldName>
                        <EntityCard
                            entity={referencedEntityData.entity}
                            entityTemplate={referencedEntityData.entityTemplate}
                            expandCard={false}
                            enableEdit={false}
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
                    </Box>
                </Slide>
            )}
            {!referencedEntityData && isViewMode && (
                <Grid container spacing={1} alignItems="center" key={field}>
                    <Grid item>
                        <Typography display="inline" variant="body1">
                            {title}:
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Typography display="inline" variant="h6">
                            -
                        </Typography>
                    </Grid>
                </Grid>
            )}
            {errorText && <Typography color="error">{errorText}</Typography>}
        </Grid>
    );
};
