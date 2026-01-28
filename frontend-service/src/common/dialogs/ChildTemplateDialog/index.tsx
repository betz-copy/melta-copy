import { Close } from '@mui/icons-material';
import {
    Autocomplete,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
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
import { IChildTemplate, IChildTemplateProperty, IMongoChildTemplateWithConstraintsPopulated, ViewType } from '@packages/child-template';
import { FilterLogicalOperator } from '@packages/entity';
import { IEntitySingleProperty, IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { AxiosError } from 'axios';
import { Form, Formik } from 'formik';
import i18next from 'i18next';
import { isEmpty, pick } from 'lodash';
import React, { useMemo } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { IChildTemplateForm, IChildTemplateFormProperty } from '../../../interfaces/childTemplateForms';
import { ICategoryMap, IChildTemplateMap } from '../../../interfaces/template';
import { createChildTemplate, updateChildTemplate } from '../../../services/templates/childTemplatesService';
import { parseFilters } from '../../../services/templates/entityTemplatesService';
import { childTemplateKeys } from '../../../utils/childTemplates';
import { filterDocumentToFilterBackend } from '../../../utils/dashboard/formik';
import { ColoredEnumChip } from '../../ColoredEnumChip';
import { ErrorToast } from '../../ErrorToast';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';
import { IAgGridFilter } from '../../wizards/entityTemplate/commonInterfaces';
import { FilterModelToFilterRecord } from '../../wizards/entityTemplate/RelationshipReference/TemplateFilterToBackend';
import { emptyChildTemplate } from '../entity';
import FieldsAndFiltersTable from './FieldsAndFiltersTable';
import SelectFilterByFieldDialog from './SelectFilterByFieldDialog';
import { childTemplateSchema } from './validation';

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
    | { actionType: ActionMode.Duplicate; payload: IMongoChildTemplateWithConstraintsPopulated }
    | { actionType: ActionMode.Update; payload: IMongoChildTemplateWithConstraintsPopulated };

export type IMutationProps = IMutationWithPayload & {
    onSuccess?: (childTemplate: IMongoChildTemplateWithConstraintsPopulated) => void;
    onError?: (childTemplate: IMongoChildTemplateWithConstraintsPopulated) => void;
};

const ChildTemplateDialog: React.FC<{
    mutationProps: IMutationProps;
    open: boolean;
    handleClose: () => void;
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated;
}> = ({ mutationProps, open, handleClose, entityTemplate }) => {
    const { actionType, payload: childTemplate } = mutationProps;

    const queryClient = useQueryClient();
    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildTemplates')!;

    const [selectFilterByFieldDialog, setSelectFilterByFieldDialog] = React.useState<{ open: boolean; mode: FilterMode }>({
        open: false,
        mode: FilterMode.User,
    });

    const normalizeProperty = (
        { display, filters, defaultValue, isEditableByUser }: IEntitySingleProperty & IChildTemplateProperty,
        parentId: string,
        forceDisplay = false,
    ): IChildTemplateFormProperty => ({
        defaultValue,
        isEditableByUser,
        display: forceDisplay || display,
        filters: filters
            ? FilterModelToFilterRecord(parseFilters(filters), parentId, queryClient, FilterLogicalOperator.OR)
                  .map(({ filterField }) => filterField)
                  .filter((f): f is IAgGridFilter => f !== undefined)
            : undefined,
    });

    const getInitialValues = ({
        name,
        displayName,
        category,
        properties,
        ...rest
    }: IMongoChildTemplateWithConstraintsPopulated): IChildTemplateForm => {
        const newProperties: IChildTemplateForm['properties']['properties'] = Object.fromEntries([
            ...entityTemplate.properties.required.map((reqKey) => [reqKey, { display: true }]),
            ...Object.entries(properties.properties).map(([key, prop]) => [key, normalizeProperty(prop, rest?.parentTemplate._id)]),
        ]);

        return {
            ...rest,
            name: name.replace(`${entityTemplate.name}_`, ''),
            displayName: displayName.replace(`${entityTemplate.displayName}-`, ''),
            category: rest._id ? category : entityTemplate.category,
            properties: { properties: newProperties },
            filterByCurrentUserField: rest.filterByCurrentUserField ?? undefined,
            filterByUnitUserField: rest.filterByUnitUserField ?? undefined,
        };
    };

    const existingNames =
        actionType !== ActionMode.Update
            ? Array.from(childTemplates.values())
                  .filter((t) => t.parentTemplate._id === entityTemplate._id && (!childTemplate || t._id !== childTemplate._id))
                  .map((t) => t.name)
            : [];

    const existingDisplayNames =
        actionType !== ActionMode.Update
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
            queryClient.setQueryData<IChildTemplateMap>('getChildTemplates', (prevData) => {
                const newMap = new Map(prevData || new Map());
                newMap.set(data._id, data);
                return newMap;
            });

            Promise.all([
                queryClient.invalidateQueries('getChildTemplates'),
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

    const userFields = useMemo(
        () =>
            Object.entries(entityTemplate.properties.properties)
                .filter(([_, prop]) => prop.format === 'user')
                .map(([key]) => key),
        [entityTemplate],
    );

    const unitFields = useMemo(
        () =>
            Object.entries(entityTemplate.properties.properties)
                .filter(([_, prop]) => prop.format === 'unitField')
                .map(([key]) => key),
        [entityTemplate],
    );

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
                validationSchema={childTemplateSchema(existingNames, existingDisplayNames, entityTemplate)}
                onSubmit={async (values) => {
                    const { name, displayName, ...pickedValues } = pick(values, childTemplateKeys) as unknown as IChildTemplate;

                    const newProperties = Object.fromEntries(
                        Object.entries(values.properties.properties).map(([key, { filters, ...rest }]) => [
                            key,
                            {
                                ...rest,
                                filters: filters
                                    ? filterDocumentToFilterBackend(
                                          values.parentTemplate._id || entityTemplate._id,
                                          filters.map((filter) => ({ filterProperty: key, filterField: filter })),
                                          queryClient,
                                          FilterLogicalOperator.OR,
                                      )
                                    : undefined,
                            },
                        ]),
                    );

                    await handleChildTemplate({
                        ...pickedValues,
                        name: `${entityTemplate.name}_${name}`,
                        displayName: `${entityTemplate.displayName}-${displayName}`,
                        parentTemplateId: entityTemplate._id,
                        category: values.category._id,
                        properties: { properties: newProperties },
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

                    const tableTitles = [
                        { title: 'name' },
                        { title: 'filter', sxOverride: { textAlign: 'center' } },
                        { title: 'default', sxOverride: { textAlign: 'center' } },
                        { title: 'filterByUser', sxOverride: { textAlign: 'center' }, show: values.viewType === ViewType.userPage },
                    ];

                    return (
                        <Form>
                            <DialogTitle>
                                <Typography fontSize="16px" fontWeight={400}>{`${i18next.t(
                                    `childTemplate.${actionType === ActionMode.Duplicate ? 'create' : actionType}Title`,
                                )} - ${childTemplate?.displayName ?? entityTemplate.displayName}`}</Typography>
                                <IconButton
                                    aria-label="close"
                                    onClick={() => handleClose()}
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
                                    <Grid container spacing={2}>
                                        {textFields.map(({ title, startAdornment, disableInUpdate }) => (
                                            <Grid size={{ xs: 4 }} key={title}>
                                                <TextField
                                                    fullWidth
                                                    label={i18next.t(`childTemplate.${title}`)}
                                                    name={title}
                                                    value={values[title].trimStart()}
                                                    onChange={(e) => handleChange({ target: { name: title, value: e.target.value.trimStart() } })}
                                                    error={touched[title] && Boolean(errors[title])}
                                                    helperText={touched[title] && errors[title]}
                                                    slotProps={{
                                                        input: {
                                                            startAdornment: startAdornment && (
                                                                <InputAdornment position="start">
                                                                    <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>
                                                                        {startAdornment}
                                                                    </Typography>
                                                                </InputAdornment>
                                                            ),
                                                        },
                                                    }}
                                                    disabled={disableInUpdate && actionType === ActionMode.Update}
                                                />
                                            </Grid>
                                        ))}
                                    </Grid>

                                    <Grid container direction="row" sx={{ pt: 3, pl: 3 }} alignItems="center" justifyContent="space-between">
                                        <Grid size={{ xs: 6 }}>
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
                                                            key={val}
                                                        />
                                                    ))}
                                                </RadioGroup>
                                            </FormControl>
                                        </Grid>
                                        <Grid container direction="row" justifyContent="space-between">
                                            {checkboxesFields.map(({ mode, fields, checked, value }) => {
                                                if (fields.length === 0) return null;

                                                const isOtherChecked =
                                                    mode === FilterMode.User ? values.isFilterByUserUnit : values.isFilterByCurrentUser;

                                                return (
                                                    <React.Fragment key={fields.toString()}>
                                                        <Grid>
                                                            <FormControlLabel
                                                                control={
                                                                    <MeltaCheckbox
                                                                        checked={checked}
                                                                        onChange={(e) =>
                                                                            updateFilterBy(!!e.target.checked, mode, undefined, e.target.checked)
                                                                        }
                                                                        disabled={isOtherChecked}
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
                                                    </React.Fragment>
                                                );
                                            })}
                                        </Grid>
                                    </Grid>

                                    <Grid container sx={{ pt: 3, pl: 2 }} alignItems="center" justifyContent="space-between">
                                        <Grid size={{ xs: 6 }}>
                                            <FormControl fullWidth>
                                                <Autocomplete
                                                    id="category"
                                                    options={Array.from(categories.values())}
                                                    onChange={(_e, value) => setFieldValue('category', value || '')}
                                                    value={values.category._id ? values.category : null}
                                                    getOptionLabel={(option) => option.displayName}
                                                    isOptionEqualToValue={(option, value) => option._id === value._id}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            error={Boolean(touched.category && errors.category)}
                                                            fullWidth
                                                            helperText={
                                                                (touched.category && errors.category?._id) ||
                                                                errors.category?.displayName ||
                                                                errors.category?.name
                                                            }
                                                            name="category"
                                                            variant="outlined"
                                                            label={i18next.t('childTemplate.categoryType.relatedToLabel')}
                                                        />
                                                    )}
                                                    renderOption={(props, category) => (
                                                        <li {...props} key={category._id}>
                                                            <ColoredEnumChip label={category.displayName} enumColor="default" />
                                                        </li>
                                                    )}
                                                />
                                            </FormControl>
                                        </Grid>
                                        {!!unitFields.length && (
                                            <Grid size={{ xs: 5.5 }}>
                                                <TextField
                                                    fullWidth
                                                    rows={1}
                                                    dir="rtl"
                                                    variant="outlined"
                                                    value={i18next.t('childTemplate.connectToUserPage')}
                                                    disabled
                                                />
                                            </Grid>
                                        )}
                                    </Grid>

                                    <Grid container sx={{ pt: 4 }} alignSelf="center" width="98%" justifyContent="space-between">
                                        <Grid size={{ xs: 12 }}>
                                            <Typography
                                                sx={{
                                                    fontWeight: 400,
                                                    fontSize: '16px',
                                                    mb: 2,
                                                }}
                                            >
                                                {i18next.t('childTemplate.columns.title')}
                                            </Typography>
                                            {!isEmpty(touched) && errors.properties?.properties && (
                                                <Grid sx={{ my: 1, pr: 2, pl: 2 }}>
                                                    <Typography color="error" variant="caption" fontSize="14px">
                                                        {String(errors.properties?.properties)}
                                                    </Typography>
                                                </Grid>
                                            )}
                                            <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 1.5, pl: 2 }}>
                                                {tableTitles
                                                    .filter(({ show }) => show !== false)
                                                    .map(({ title, sxOverride }) => (
                                                        <Grid size={{ xs: 3 }} key={title}>
                                                            <Typography sx={{ fontWeight: 400, fontSize: '14px', ...sxOverride }}>
                                                                {i18next.t(`childTemplate.columns.${title}Col`)}
                                                            </Typography>
                                                        </Grid>
                                                    ))}
                                            </Grid>
                                            <Divider />

                                            <Grid size={{ xs: 12 }} sx={{ maxHeight: 400, overflowY: 'auto', px: 2 }}>
                                                <FieldsAndFiltersTable formikProps={formikProps} entityTemplate={entityTemplate} />
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </DialogContent>

                            <DialogActions sx={{ margin: '10px' }}>
                                <Grid container justifyContent="center">
                                    {actionType === ActionMode.Update && (
                                        <Button sx={{ borderRadius: '7px', padding: '7px 10px' }} onClick={handleClose}>
                                            {i18next.t('childTemplate.buttons.cancel')}
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        sx={{ borderRadius: '7px', padding: '7px 30px', fontWeight: 400 }}
                                        disabled={!dirty || isLoading}
                                    >
                                        {i18next.t(`actions.${actionType === ActionMode.Update ? 'save' : 'create'}`)}
                                    </Button>
                                </Grid>
                            </DialogActions>

                            <SelectFilterByFieldDialog
                                open={selectFilterByFieldDialog.open}
                                filterModeOptions={selectFilterByFieldDialog.mode === FilterMode.User ? userFields : unitFields}
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

export default ChildTemplateDialog;
