import { Close } from '@mui/icons-material';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputAdornment,
    Radio,
    RadioGroup,
    TextField,
    Typography,
} from '@mui/material';
import { AxiosError } from 'axios';
import { Form, Formik } from 'formik';
import i18next from 'i18next';
import React, { useMemo } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import {
    IChildTemplate,
    IChildTemplateMap,
    IChildTemplatePopulatedFromDb,
    IMongoChildTemplatePopulated,
    ViewType,
} from '../../../interfaces/childTemplates';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { createChildTemplate, updateChildTemplate } from '../../../services/templates/childTemplatesService';
import { ErrorToast } from '../../ErrorToast';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';
import SelectUserFieldDialog from '../createChildTemplate/SelectUserFieldDialog';
import { createChildTemplateSchema } from '../createChildTemplate/validation';
import { emptyChildTemplate } from '../entity';

export enum ActionMode {
    Create = 'create',
    Duplicate = 'duplicate',
    Update = 'update',
}

enum FilterMode {
    User = 'User',
    Unit = 'Unit',
}

export type IMutationWithPayload =
    | { actionType: ActionMode.Create; payload: undefined }
    | { actionType: ActionMode.Duplicate; payload: IMongoChildTemplatePopulated }
    | { actionType: ActionMode.Update; payload: IMongoChildTemplatePopulated };

export type IMutationProps = IMutationWithPayload & {
    onSuccess?: (childTemplate: IMongoChildTemplatePopulated) => void;
    onError?: (childTemplate: IMongoChildTemplatePopulated) => void;
};

const AddChildTemplateDialog: React.FC<{
    mutationProps: IMutationProps;
    open: boolean;
    handleClose: () => void;
    entityTemplate: IMongoEntityTemplatePopulated | null;
}> = ({ mutationProps, open, handleClose, entityTemplate }) => {
    if (!entityTemplate) return null;

    const { actionType, payload: childTemplate } = mutationProps;

    const queryClient = useQueryClient();
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildEntityTemplates');

    const [openSelectUserFieldDialog, setOpenSelectUserFieldDialog] = React.useState<boolean>(false);
    const [openSelectUnitFieldDialog, setOpenSelectUnitFieldDialog] = React.useState<boolean>(false);

    const replaceNamePrefix = (childTemplate: IMongoChildTemplatePopulated) => ({
        ...childTemplate,
        name: childTemplate.name.replace(`${entityTemplate.name}_`, ''),
        displayName: childTemplate.displayName.replace(`${entityTemplate.displayName}-`, ''),
        category: childTemplate._id ? childTemplate.category : entityTemplate.category,
    });

    const existingNames = childTemplates
        ? Array.from(childTemplates.values())
              .filter((t) => t.parentTemplate._id === entityTemplate._id && (!childTemplate || t._id !== childTemplate._id))
              .map((t) => t.name)
        : [];

    const existingDisplayNames = childTemplates
        ? Array.from(childTemplates.values())
              .filter((t) => t.parentTemplate._id === entityTemplate._id && (!childTemplate || t._id !== childTemplate._id))
              .map((t) => t.displayName)
        : [];

    const { mutateAsync: handleChildTemplate, isLoading } = useMutation({
        mutationFn: (templateData: IChildTemplate) => {
            if (actionType === ActionMode.Update) return updateChildTemplate(childTemplate._id, templateData);
            return createChildTemplate(templateData);
        },
        onSuccess: (data) => {
            queryClient.setQueryData<IChildTemplateMap>('getChildEntityTemplates', (prevData) => {
                const newMap = new Map(prevData || new Map());
                newMap.set(data._id, data);
                return newMap;
            });

            Promise.all([
                queryClient.invalidateQueries('getChildEntityTemplates'),
                queryClient.invalidateQueries('getEntityTemplates'),
                queryClient.invalidateQueries('searchEntityTemplates'),
            ]).then(() => {
                toast.success(i18next.t(`childTemplate.succeededTo${childTemplate ? 'Update' : 'Create'}ChildTemplate`));
                handleClose();
            });
        },
        onError: (err: AxiosError) => {
            toast.error(
                <ErrorToast
                    axiosError={err}
                    defaultErrorMessage={i18next.t(`childTemplate.failedTo${childTemplate ? 'Update' : 'Create'}ChildTemplate`)}
                />,
            );
        },
    });

    const userFields = useMemo(() => {
        return Object.entries(entityTemplate.properties.properties)
            .filter(([_, prop]) => prop.format === 'user')
            .map(([key]) => key);
    }, [entityTemplate]);

    const unitFields = useMemo(() => {
        return Object.entries(entityTemplate.properties.properties)
            .filter(([_, prop]) => prop.format === 'unitField')
            .map(([key]) => key);
    }, [entityTemplate]);

    return (
        <Dialog open={open} maxWidth="md" fullWidth disableEnforceFocus>
            <Formik<IChildTemplatePopulatedFromDb>
                initialValues={replaceNamePrefix(childTemplate ?? emptyChildTemplate)}
                validationSchema={createChildTemplateSchema(existingNames, existingDisplayNames)}
                onSubmit={async (values, formikHelpers) => {
                    formikHelpers.setTouched({});
                    handleChildTemplate({
                        ...values,
                        parentTemplateId: entityTemplate._id,
                        category: values.category._id,
                    });
                }}
            >
                {(formikProps) => {
                    const { values, handleChange, setFieldValue, dirty, touched, errors } = formikProps;

                    const updateFilterBy = (open: boolean, mode: FilterMode, field?: string, isFilterByCurrentUser?: boolean) => {
                        if (mode === FilterMode.User) setOpenSelectUserFieldDialog(open);
                        else setOpenSelectUnitFieldDialog(open);

                        handleChange({
                            target: { name: `filterBy${mode === FilterMode.User ? 'Current' : mode}UserField`, value: field },
                        });

                        if (isFilterByCurrentUser !== undefined)
                            handleChange({
                                target: { name: `isFilterBy${mode === FilterMode.User ? 'Current' : 'User'}${mode}`, value: isFilterByCurrentUser },
                            });
                    };

                    return (
                        <Form>
                            <DialogTitle>
                                <Typography fontSize="16px" fontWeight={400}>{`${i18next.t(
                                    `childTemplate.${actionType === ActionMode.Update ? 'updateTemplate' : 'template'}Title`,
                                )} - ${childTemplate?.displayName ?? entityTemplate.displayName}`}</Typography>
                                <IconButton
                                    aria-label="close"
                                    onClick={async () => {
                                        handleClose();
                                    }}
                                    sx={{
                                        position: 'absolute',
                                        right: 12,
                                        top: 12,
                                        color: (theme) => theme.palette.grey[500],
                                    }}
                                >
                                    <Close />
                                </IconButton>
                            </DialogTitle>

                            <DialogContent>
                                <Grid container spacing={2} direction="column" sx={{ pt: 1 }}>
                                    <Grid container item spacing={2}>
                                        <Grid item xs={4}>
                                            <TextField
                                                fullWidth
                                                label={i18next.t('childTemplate.templateName')}
                                                name="name"
                                                value={values.name.trimStart()}
                                                onChange={(e) => handleChange({ target: { name: 'name', value: e.target.value.trimStart() } })}
                                                error={touched.name && Boolean(errors.name)}
                                                helperText={touched.name && errors.name}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">{entityTemplate.name}_</InputAdornment>,
                                                }}
                                                disabled={actionType === ActionMode.Update}
                                            />
                                        </Grid>
                                        <Grid item xs={4}>
                                            <TextField
                                                fullWidth
                                                label={i18next.t('childTemplate.templateDisplayName')}
                                                name="displayName"
                                                value={values.displayName.trimStart()}
                                                onChange={(e) => handleChange({ target: { name: 'displayName', value: e.target.value.trimStart() } })}
                                                error={touched.displayName && Boolean(errors.displayName)}
                                                helperText={touched.displayName && errors.displayName}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">{entityTemplate.displayName}-</InputAdornment>,
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={4}>
                                            <TextField
                                                fullWidth
                                                label={i18next.t('childTemplate.templateDetails')}
                                                name="description"
                                                value={values.description}
                                                onChange={handleChange}
                                                error={touched.description && Boolean(errors.description)}
                                                helperText={touched.description && errors.description}
                                                multiline
                                                rows={1}
                                            />
                                        </Grid>
                                    </Grid>

                                    <Grid container direction="row" sx={{ pt: 3, pl: 3 }} alignItems="center" justifyContent="space-between">
                                        <Grid item xs={6}>
                                            <FormControl fullWidth>
                                                <RadioGroup
                                                    value={values.viewType}
                                                    onChange={(e) => {
                                                        const { value } = e.target;
                                                        handleChange({ target: { name: 'viewType', value: value } });

                                                        if (value !== ViewType.categoryPage) return;

                                                        const updatedFilters = Object.entries(values.properties.properties).reduce(
                                                            (acc, [key, property]) => {
                                                                acc[key] = {
                                                                    ...property,
                                                                    isEditableByUser: property.isEditableByUser ? false : property.isEditableByUser,
                                                                };
                                                                return acc;
                                                            },
                                                            {},
                                                        );
                                                        setFieldValue('.properties.properties', updatedFilters);
                                                    }}
                                                    row
                                                >
                                                    <FormControlLabel
                                                        value="categoryPage"
                                                        control={<Radio />}
                                                        label={i18next.t('childTemplate.status.categoryPage')}
                                                        componentsProps={{
                                                            typography: { sx: { fontSize: '14px' } },
                                                        }}
                                                    />
                                                    <FormControlLabel
                                                        value="userPage"
                                                        control={<Radio />}
                                                        label={i18next.t('childTemplate.status.userPage')}
                                                        componentsProps={{
                                                            typography: { sx: { fontSize: '14px' } },
                                                        }}
                                                    />
                                                </RadioGroup>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={5.5} container direction="row" justifyContent="space-between">
                                            {userFields.length > 0 && (
                                                <Grid item>
                                                    <FormControlLabel
                                                        control={
                                                            <MeltaCheckbox
                                                                checked={values.isFilterByCurrentUser}
                                                                onChange={(e) =>
                                                                    updateFilterBy(!!e.target.checked, FilterMode.User, undefined, e.target.checked)
                                                                }
                                                            />
                                                        }
                                                        label={i18next.t('childTemplate.userType.regularUser')}
                                                        componentsProps={{
                                                            typography: { sx: { fontSize: '14px' } },
                                                        }}
                                                    />
                                                    {values.filterByCurrentUserField && (
                                                        <Typography sx={{ fontSize: '12px', color: 'text.secondary', ml: 4 }}>
                                                            {`${i18next.t('childTemplate.selectUserDialog.byUser')} : ${
                                                                entityTemplate.properties.properties[values.filterByCurrentUserField].title
                                                            }`}
                                                        </Typography>
                                                    )}
                                                </Grid>
                                            )}
                                            {unitFields.length > 0 && (
                                                <Grid item>
                                                    <FormControlLabel
                                                        control={
                                                            <MeltaCheckbox
                                                                checked={values.isFilterByUserUnit}
                                                                onChange={(e) =>
                                                                    updateFilterBy(!!e.target.checked, FilterMode.Unit, undefined, e.target.checked)
                                                                }
                                                            />
                                                        }
                                                        label={i18next.t('childTemplate.userType.specialUser')}
                                                        componentsProps={{
                                                            typography: { sx: { fontSize: '14px' } },
                                                        }}
                                                    />
                                                    {values.filterByUnitUserField && (
                                                        <Typography sx={{ fontSize: '12px', color: 'text.secondary', ml: 4 }}>
                                                            {`${i18next.t('childTemplate.selectUserUnitDialog.label')} : ${
                                                                entityTemplate.properties.properties[values.filterByUnitUserField].title
                                                            }`}
                                                        </Typography>
                                                    )}
                                                </Grid>
                                            )}
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </DialogContent>

                            <DialogActions sx={{ margin: '10px' }}>
                                <Grid container justifyContent="center">
                                    {actionType === ActionMode.Update && (
                                        <Button sx={{ borderRadius: '7px', padding: '6.99px 10px' }} onClick={handleClose}>
                                            {i18next.t('childTemplate.buttons.cancel')}
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        sx={{ borderRadius: '7px', padding: '6.99px 30px', fontWeight: 400 }}
                                        disabled={!dirty || isLoading}
                                    >
                                        {i18next.t(`actions.${actionType === ActionMode.Update ? 'save' : 'create'}`)}
                                    </Button>
                                </Grid>
                            </DialogActions>

                            <SelectUserFieldDialog
                                open={openSelectUserFieldDialog}
                                userFields={userFields}
                                selectedField={values.filterByCurrentUserField || null}
                                onClose={() => updateFilterBy(false, FilterMode.User, undefined, false)}
                                onSubmit={(field) => updateFilterBy(false, FilterMode.User, field)}
                                entityTemplate={entityTemplate}
                            />
                            <SelectUserFieldDialog
                                open={openSelectUnitFieldDialog}
                                userFields={unitFields}
                                selectedField={values.filterByUnitUserField || null}
                                onClose={() => updateFilterBy(false, FilterMode.Unit, undefined, false)}
                                onSubmit={(field) => updateFilterBy(false, FilterMode.Unit, field)}
                                entityTemplate={entityTemplate}
                                title={i18next.t('childTemplate.selectUserUnitDialog.title')}
                                content={i18next.t('childTemplate.selectUserUnitDialog.content')}
                                label={i18next.t('childTemplate.selectUserUnitDialog.label')}
                            />
                        </Form>
                    );
                }}
            </Formik>
        </Dialog>
    );
};

export default AddChildTemplateDialog;
