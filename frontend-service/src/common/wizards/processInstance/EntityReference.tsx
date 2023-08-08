import React, { useMemo, useState } from 'react';
import TemplateTableSelect from '../../inputs/TemplateTableSelect';
import i18next from 'i18next';
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
} from '@mui/material';
import { useQueryClient } from 'react-query';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IPermissionsOfUser } from '../../../services/permissionsService';
import RemoveIcon from '@mui/icons-material/Close';
import EntityCard  from '../../../pages/GlobalSearch/components/entityCard';
import AddIcon from '@mui/icons-material/Add';
import { ProcessDetailsValues } from './ProcessDetails';
import { SummaryDetailsValues } from './ProcessSummaryStep';
import { ProcessStepValues } from './ProcessSteps';
import { FormikProps } from 'formik';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { IReferencedEntityForProcess } from '../../../interfaces/processes/processInstance';

type ProcessFormikProps = ProcessStepValues | ProcessDetailsValues | SummaryDetailsValues;
interface ChooseEntityReferenceProps {
    field: string;
    values: FormikProps<ProcessFormikProps>['values'];
    errors: FormikProps<ProcessFormikProps>['errors'];
    touched: FormikProps<ProcessFormikProps>['touched'];
    setFieldValue: FormikProps<ProcessFormikProps>['setFieldValue'];
    handleBlur: FormikProps<ProcessFormikProps>['handleBlur'];
    isViewMode: boolean;
    title: string;
}

export const EntityReference: React.FC<ChooseEntityReferenceProps> = ({
    field,
    values,
    errors,
    touched,
    setFieldValue,
    handleBlur,
    isViewMode,
    title,
}) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);
    const referencedEntityData = (values.entityReferences[field] as IReferencedEntityForProcess) ?? null;
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    const activeEntityTemplatesFiltered: IMongoEntityTemplatePopulated[] = useMemo(() => {
        return Array.from(entityTemplates.values())
            .filter((entity) => myPermissions.instancesPermissions.some(({ category }) => category === entity.category._id))
            .filter((entity) => !entity.disabled);
    }, [entityTemplates, myPermissions]);

    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    const handleRemoveEntity = () => {
        setIsAnimatingOut(true);
        setTimeout(() => {
            setIsAnimatingOut(false);
            setFieldValue(`entityReferences.${field}`, null);
            setChooseEntityOpen(false);
        }, 500);
    };

    const [chooseEntityOpen, setChooseEntityOpen] = useState<boolean>(false);

    return (
        <Grid paddingBottom={2}>
            <Collapse
                in={!referencedEntityData && !isViewMode}
                {...(referencedEntityData?.entity ? { timeout: 250 } : {})}
                mountOnEnter
                unmountOnExit
            >
                <Button
                    onClick={() => setChooseEntityOpen(true)}
                    variant="outlined"
                    startIcon={<AddIcon style={{ fontSize: '27px' }} />}
                    size="large"
                >
                    {title}
                </Button>
            </Collapse>
            <Popover
                open={chooseEntityOpen && Boolean(!referencedEntityData?.entity) && !isViewMode}
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
                            <IconButton onClick={() => setChooseEntityOpen(false)}>
                                <RemoveIcon />
                            </IconButton>
                        }
                    />

                    <CardContent>
                        <TemplateTableSelect
                            entityTemplate={referencedEntityData?.entityTemplate}
                            value={values.entityReferences[field]?.entity}
                            onChange={(value) => {
                                setFieldValue(`entityReferences.${field}.entity`, value);
                            }}
                            onBlur={(event) => {
                                handleBlur(field)(event);
                            }}
                            error={Boolean(touched[`entityReferences.${field}`] && errors[`entityReferences.${field}`])}
                            helperText={touched[`entityReferences.${field}`] ? errors[`entityReferences.${field}`] : ''}
                            label={i18next.t('wizard.processInstance.chooseRefEntity')}
                            autoLoad
                            hideNonPreview
                        />
                    </CardContent>
                </Card>
            </Popover>

            {referencedEntityData?.entity && (
                <Slide direction="left" in={!isAnimatingOut} timeout={1000} mountOnEnter unmountOnExit>
                    <Box marginTop={'-20px'} paddingBottom={1}>
                        <Typography
                            sx={{
                                top: '8px',
                                left: '20px',
                                hight: '3px',
                                position: 'relative',
                                width: 'fit-content',
                                fontSize: '11px',
                                letterSpacing: '1px',
                                background: darkMode ? '#383838' : 'white',
                                paddingRight: 1,
                                paddingLeft: 1,
                                color: darkMode ? 'whitesmoke' : 'gray',
                                borderRadius: 10,
                            }}
                        >
                            {title}
                        </Typography>
                        <EntityCard
                            entity={referencedEntityData.entity}
                            entityTemplate={referencedEntityData.entityTemplate}
                            openCard={false}
                            customActionButton={
                                isViewMode
                                    ? undefined
                                    : {
                                          onClick: handleRemoveEntity,
                                          icon: <RemoveIcon />,
                                          popoverText: i18next.t('wizard.processInstance.changeEntity'),
                                      }
                            }
                            userHavePermission={referencedEntityData.userHavePermission}
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
        </Grid>
    );
};
