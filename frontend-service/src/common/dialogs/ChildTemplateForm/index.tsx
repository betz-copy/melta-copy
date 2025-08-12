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
import { isEmpty } from 'lodash';
import React, { useMemo } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { IChildTemplate, IChildTemplateForm, IChildTemplateMap, IMongoChildTemplatePopulated, ViewType } from '../../../interfaces/childTemplates';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { createChildTemplate, updateChildTemplate } from '../../../services/templates/childTemplatesService';
import { parseFilters } from '../../../services/templates/entityTemplatesService';
import { filterDocumentToFilterBackend } from '../../../utils/dashboard/formik';
import { ErrorToast } from '../../ErrorToast';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';
import { FilterModelToFilterRecord } from '../../wizards/entityTemplate/RelationshipReference/TemplateFilterToBackend';
import SelectFilterByFieldDialog from './SelectFilterByFieldDialog';
import { createChildTemplateSchema } from '../createChildTemplate/validation';
import { emptyChildTemplate } from '../entity';
import FieldsAndFiltersTable from './FieldsAndFiltersTable';

export enum ActionMode {
    Create = 'create',
    Duplicate = 'duplicate',
    Update = 'update',
}

export enum FilterMode {
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

const ChildTemplateFormDialog: React.FC<{
    mutationProps: IMutationProps;
    open: boolean;
    handleClose: () => void;
    entityTemplate: IMongoEntityTemplatePopulated | null;
}> = ({ mutationProps, open, handleClose, entityTemplate }) => {
    if (!entityTemplate) return null;

    const { actionType, payload: childTemplate } = mutationProps;

    const queryClient = useQueryClient();
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildEntityTemplates');

    const [selectFilterByFieldDialog, setSelectFilterByFieldDialog] = React.useState<{ open: boolean; mode: FilterMode }>({
        open: false,
        mode: FilterMode.User,
    });

    const getInitialValues = ({ name, displayName, category, properties, ...rest }: IMongoChildTemplatePopulated): IChildTemplateForm => {
        const newProperties = Object.fromEntries(
            Object.entries(properties.properties).map(([key, { filters, defaultValue, isEditableByUser, display }]) => [
                key,
                {
                    defaultValue,
                    isEditableByUser,
                    display,
                    filters: filters
                        ? FilterModelToFilterRecord(parseFilters(filters), rest?.parentTemplate._id!, queryClient)
                              .map(({ filterField }) => filterField)
                              .filter((f) => f !== undefined)
                        : undefined,
                },
            ]),
        );

        return {
            ...rest,
            name: name.replace(`${entityTemplate.name}_`, ''),
            displayName: displayName.replace(`${entityTemplate.displayName}-`, ''),
            category: rest._id ? category : entityTemplate.category,
            properties: { ...properties, properties: newProperties },
        };
    };

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

    const radioValues = ['categoryPage', 'userPage'];

    const textFields = [
        { title: 'name', startAdornment: `${entityTemplate.name}_`, disableInUpdate: true },
        { title: 'displayName', startAdornment: `${entityTemplate.displayName}-`, disableInUpdate: true },
        { title: 'description' },
    ];

    return (
        <Dialog open={open} maxWidth="md" fullWidth disableEnforceFocus>
            <Formik<IChildTemplateForm>
                initialValues={getInitialValues(childTemplate ?? emptyChildTemplate)}
                validationSchema={createChildTemplateSchema(existingNames, existingDisplayNames)}
                onSubmit={async (values, formikHelpers) => {
                    formikHelpers.setTouched({});
                    const newProperties = Object.fromEntries(
                        Object.entries(values.properties.properties).map(([key, { filters, ...rest }]) => [
                            key,
                            {
                                ...rest,
                                // filters:  filters? filterModelToFilterOfTemplatePerField(entityTemplate.properties.properties[key], key, value!): undefined
                                filters: filters
                                    ? filterDocumentToFilterBackend(
                                          values.parentTemplate._id,
                                          filters.map((filter) => ({ filterProperty: key, filterField: filter })),
                                          queryClient,
                                      )
                                    : undefined,
                            },
                        ]),
                    );
                    handleChildTemplate({
                        ...values,
                        parentTemplateId: entityTemplate._id,
                        category: values.category._id,
                        properties: { ...values.properties, properties: newProperties },
                    });
                }}
            >
                {(formikProps) => {
                    const { values, handleChange, setFieldValue, dirty, touched, errors } = formikProps;

                    const updateFilterBy = (open: boolean, mode: FilterMode, field?: string, isFilterByCurrentUser?: boolean) => {
                        setSelectFilterByFieldDialog({ open, mode });

                        handleChange({
                            target: { name: `filterBy${mode === FilterMode.User ? 'Current' : mode}UserField`, value: field },
                        });

                        if (isFilterByCurrentUser !== undefined)
                            handleChange({
                                target: { name: `isFilterBy${mode === FilterMode.User ? 'Current' : 'User'}${mode}`, value: isFilterByCurrentUser },
                            });
                    };

                    const checkboxesFields = [
                        { mode: FilterMode.User, fields: userFields, checked: values.isFilterByCurrentUser, value: values.filterByCurrentUserField },
                        { mode: FilterMode.Unit, fields: unitFields, checked: values.isFilterByUserUnit, value: values.filterByUnitUserField },
                    ];

                    return (
                        <Form>
                            <DialogTitle>
                                <Typography fontSize="16px" fontWeight={400}>{`${i18next.t(
                                    `childTemplate.${actionType === ActionMode.Duplicate ? 'create' : actionType}Title`,
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
                                        {textFields.map(({ title, startAdornment, disableInUpdate }) => (
                                            <Grid item xs={4}>
                                                <TextField
                                                    fullWidth
                                                    label={i18next.t(`childTemplate.${title}`)}
                                                    name={title}
                                                    value={values[title].trimStart()}
                                                    onChange={(e) => handleChange({ target: { name: title, value: e.target.value.trimStart() } })}
                                                    error={touched[title] && Boolean(errors[title])}
                                                    helperText={touched[title] && errors[title]}
                                                    InputProps={{
                                                        startAdornment: startAdornment && (
                                                            <InputAdornment position="start">
                                                                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>
                                                                    {startAdornment}
                                                                </Typography>
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                    disabled={disableInUpdate && actionType === ActionMode.Update}
                                                />
                                            </Grid>
                                        ))}
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
                                                    {radioValues.map((val) => (
                                                        <FormControlLabel
                                                            value={val}
                                                            control={<Radio />}
                                                            label={i18next.t(`childTemplate.status.${val}`)}
                                                            componentsProps={{
                                                                typography: { sx: { fontSize: '14px' } },
                                                            }}
                                                        />
                                                    ))}
                                                </RadioGroup>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={5.5} container direction="row" justifyContent="space-between">
                                            {checkboxesFields.map(
                                                ({ mode, fields, checked, value }) =>
                                                    fields.length > 0 && (
                                                        <Grid item>
                                                            <FormControlLabel
                                                                control={
                                                                    <MeltaCheckbox
                                                                        checked={checked}
                                                                        onChange={(e) =>
                                                                            updateFilterBy(!!e.target.checked, mode, undefined, e.target.checked)
                                                                        }
                                                                    />
                                                                }
                                                                label={i18next.t(`childTemplate.filterBy.${mode}`)}
                                                                componentsProps={{
                                                                    typography: { sx: { fontSize: '14px' } },
                                                                }}
                                                            />
                                                            {value && (
                                                                <Typography sx={{ fontSize: '12px', color: 'text.secondary', ml: 4 }}>
                                                                    {`${i18next.t(`childTemplate.select${mode}Dialog.label`)} : ${
                                                                        entityTemplate.properties.properties[value].title
                                                                    }`}
                                                                </Typography>
                                                            )}
                                                        </Grid>
                                                    ),
                                            )}
                                        </Grid>
                                    </Grid>

                                    <Grid container sx={{ pt: 4 }} alignSelf="center" width="98%" justifyContent="space-between">
                                        <Grid item xs={12}>
                                            <Typography sx={{ fontWeight: 400, fontSize: '16px', mb: isEmpty(touched) ? '19px' : '0px' }}>
                                                {i18next.t('childTemplate.columns.title')}
                                            </Typography>
                                            {errors.properties?.properties && (
                                                <Typography sx={{ fontSize: '12px', color: 'error.main', mb: '19px' }}>
                                                    {errors.properties?.properties}
                                                </Typography>
                                            )}
                                            <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 1.5, pl: 2 }}>
                                                <Grid item xs={3}>
                                                    <Typography sx={{ fontWeight: 400, fontSize: '14px' }}>
                                                        {i18next.t('childTemplate.columns.nameCol')}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <Typography sx={{ fontWeight: 400, fontSize: '14px', textAlign: 'center' }}>
                                                        {i18next.t('childTemplate.columns.filterCol')}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <Typography sx={{ fontWeight: 400, fontSize: '14px', textAlign: 'center' }}>
                                                        {i18next.t('childTemplate.columns.defaultCol')}
                                                    </Typography>
                                                </Grid>
                                                {values.viewType === ViewType.userPage && (
                                                    <Grid item xs={3}>
                                                        <Typography sx={{ fontWeight: 400, fontSize: '14px', textAlign: 'center' }}>
                                                            {i18next.t('childTemplate.columns.filterByUserCol')}
                                                        </Typography>
                                                    </Grid>
                                                )}
                                            </Grid>

                                            <Grid item xs={12} sx={{ maxHeight: 400, overflowY: 'auto', px: 2 }}>
                                                <FieldsAndFiltersTable formikProps={formikProps} entityTemplate={entityTemplate} />
                                            </Grid>
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

                            <SelectFilterByFieldDialog
                                open={selectFilterByFieldDialog.open}
                                field={selectFilterByFieldDialog.mode === FilterMode.User ? userFields : unitFields}
                                selectedField={
                                    (selectFilterByFieldDialog.mode === FilterMode.User
                                        ? values.filterByCurrentUserField
                                        : values.filterByUnitUserField) || null
                                }
                                onClose={() => updateFilterBy(false, selectFilterByFieldDialog.mode, undefined, false)}
                                onSubmit={(field) => updateFilterBy(false, selectFilterByFieldDialog.mode, field)}
                                entityTemplate={entityTemplate}
                                filterMode={selectFilterByFieldDialog.mode}
                            />
                        </Form>
                    );
                }}
            </Formik>
        </Dialog>
    );
};

export default ChildTemplateFormDialog;
