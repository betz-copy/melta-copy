/* eslint-disable react-hooks/rules-of-hooks */
import { Close as CloseIcon } from '@mui/icons-material';
import {
    Autocomplete,
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
import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { environment } from '../../../globals';
import { ICategoryMap, IMongoCategory } from '../../../interfaces/categories';
import {
    ChipType,
    IChildTemplate,
    IChildTemplateMap,
    IChildTemplateProperty,
    IFieldChip,
    IMongoChildTemplate,
    IMongoChildTemplatePopulated,
    ITemplateFieldsFilters,
    ViewType,
} from '../../../interfaces/childTemplates';
import { ISearchFilter } from '../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { translateFieldFilter } from '../../../pages/Graph/GraphFilterToBackend';
import { createChildTemplate, updateChildTemplate } from '../../../services/templates/childTemplatesService';
import { filterModelToFilterOfTemplatePerField } from '../../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { ColoredEnumChip } from '../../ColoredEnumChip';
import { ErrorToast } from '../../ErrorToast';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';
import { emptyChildTemplate } from '../entity';
import FieldsAndFiltersTable from './FieldsAndFiltersTable';
import SelectUserFieldDialog from './SelectUserFieldDialog';
import { createChildTemplateSchema } from './validation';

const { columnWidths } = environment.agGrid.localStorage;

const CreateChildTemplateDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    entityTemplate: IMongoEntityTemplatePopulated | null;
    childTemplate?: IMongoChildTemplatePopulated;
}> = ({ open, handleClose, entityTemplate, childTemplate }) => {
    if (!entityTemplate) return null;

    const queryClient = useQueryClient();
    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const allTemplates = queryClient.getQueryData<Map<string, IMongoEntityTemplatePopulated>>('getEntityTemplates');
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildEntityTemplates');

    const [userField, setUserField] = useState<{ selectUserFieldDialogOpen: boolean; selectedUserField: string | undefined }>({
        selectUserFieldDialogOpen: false,
        selectedUserField: childTemplate?.filterByCurrentUserField || undefined,
    });

    const [unitUserField, setUnitUserField] = useState<{
        selectUnitUserFieldDialogOpen: boolean;
        selectedUnitUserField: string | undefined;
    }>({
        selectedUnitUserField: childTemplate?.filterByUnitUserField || undefined,
        selectUnitUserFieldDialogOpen: false,
    });

    const [templateFieldsFilters, setTemplateFieldsFilters] = useState<ITemplateFieldsFilters>({});
    const [childTemplateFilterByCurrentUser, setChildTemplateFilterByCurrentUser] = useState(childTemplate?.isFilterByCurrentUser || false);
    const [childTemplateFilterByUserUnit, setChildTemplateFilterByUserUnit] = useState(childTemplate?.isFilterByUserUnit || false);
    const [selectedCategory, setSelectedCategory] = useState<IMongoCategory>();
    const [childTemplateViewType, setChildTemplateViewType] = useState<ViewType>(childTemplate?.viewType || ViewType.categoryPage);
    const [fieldChips, setFieldChips] = useState<IFieldChip[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [matchValidationError, setMatchValidationError] = useState<Map<string, string>>(new Map());
    const [hasCheckedBox, setHasCheckedBox] = useState(Object.values(templateFieldsFilters).some((field) => field.selected));

    useEffect(() => {
        if (entityTemplate) {
            const initialFields: ITemplateFieldsFilters = {};
            Object.entries(entityTemplate.properties.properties).forEach(([key, value]) => {
                const isRequired = entityTemplate.properties.required.includes(key);
                const property = childTemplate?.properties.properties[key];
                const defaultValue = property?.defaultValue;
                const isSelected =
                    (childTemplate ? key in childTemplate.properties.properties && childTemplate.properties.properties[key].display : false) ||
                    (isRequired && defaultValue === undefined);
                const isEditableByUser = property?.isEditableByUser;

                initialFields[key] = {
                    selected: isSelected || (isRequired && defaultValue === undefined),
                    fieldValue: value,
                    ...(defaultValue && { defaultValue }),
                    ...(isEditableByUser && { isEditableByUser }),
                };
            });
            setTemplateFieldsFilters(initialFields);
            setSelectedCategory(childTemplate?.category ?? entityTemplate?.category);
        }
    }, [entityTemplate, childTemplate, categories]);

    useEffect(() => {
        if (!childTemplate) return;

        const chips: IFieldChip[] = [];

        Object.entries(childTemplate.properties.properties).forEach(([propertyName, { filters, defaultValue }]) => {
            const fieldTemplate = entityTemplate.properties.properties[propertyName];

            if (filters) {
                const parsedFilters: ISearchFilter = typeof filters === 'string' ? JSON.parse(filters) : filters;

                if (parsedFilters.$or && Array.isArray(parsedFilters.$or)) {
                    parsedFilters.$or.forEach((filter) => {
                        const fieldValue = filter[propertyName];
                        const translatedFilter = translateFieldFilter(fieldValue, fieldTemplate);

                        chips.push({
                            fieldName: propertyName,
                            chipType: ChipType.Filter,
                            filterField: translatedFilter,
                        });
                    });
                }
            }

            if (defaultValue !== undefined)
                chips.push({
                    fieldName: propertyName,
                    chipType: ChipType.Default,
                    defaultValue: defaultValue,
                });
        });

        setFieldChips(chips);
    }, [childTemplate]);

    useEffect(() => {
        setHasCheckedBox(Object.values(templateFieldsFilters).some((field) => field.selected));
    }, [templateFieldsFilters]);

    const userFields = useMemo(() => {
        return entityTemplate
            ? Object.entries(entityTemplate.properties.properties)
                  .filter(([_, prop]) => prop.format === 'user')
                  .map(([key]) => key)
            : [];
    }, [entityTemplate]);

    const unitFields = useMemo(() => {
        return entityTemplate
            ? Object.entries(entityTemplate.properties.properties)
                  .filter(([_, prop]) => prop.format === 'unitField')
                  .map(([key]) => key)
            : [];
    }, [entityTemplate]);

    const hasUnitTypeProperty = useMemo(
        () => Object.values(entityTemplate?.properties.properties || {}).some((property) => property.format === 'unitField'),
        [entityTemplate],
    );

    const { mutateAsync: handleChildTemplate, isLoading } = useMutation<IMongoChildTemplate, AxiosError, IChildTemplate | [IChildTemplate, string]>({
        mutationFn: (template) => {
            if (Array.isArray(template)) {
                const [templateData, id] = template;
                if (isUpdate) return updateChildTemplate(id, templateData);
                return createChildTemplate(templateData);
            }
            return createChildTemplate(template);
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

    useEffect(() => {
        if (!childTemplate) {
            setHasChanges(false);
            return;
        }

        const originalFields = new Set(Object.keys(childTemplate.properties.properties));
        const currentFields = new Set(
            Object.entries(templateFieldsFilters)
                .filter(([_, field]) => field.selected)
                .map(([key]) => key),
        );

        const hasFieldChanges =
            ![...originalFields].every((field) => currentFields.has(field)) || ![...currentFields].every((field) => originalFields.has(field));

        const hasCategoryChanges = selectedCategory?._id !== childTemplate.category._id;

        const hasFilterOrDefaultChanges = Object.entries(childTemplate.properties.properties).some(([fieldName, prop]) => {
            const currentField = templateFieldsFilters[fieldName];
            if (!currentField?.selected) return true;

            const originalDefaultValue = prop.defaultValue;
            const currentDefaultValue = fieldChips.find((chip) => chip.fieldName === fieldName && chip.chipType === 'default')?.defaultValue;

            if (
                (!originalDefaultValue && !!currentDefaultValue) ||
                (!!originalDefaultValue && !currentDefaultValue) ||
                JSON.stringify(originalDefaultValue) !== JSON.stringify(currentDefaultValue)
            ) {
                return true;
            }

            if (childTemplateViewType === ViewType.userPage) {
                const originalIsEditableByUser = prop.isEditableByUser || false;
                const currentIsEditableByUser = currentField.isEditableByUser || false;
                if (originalIsEditableByUser !== currentIsEditableByUser) {
                    return true;
                }
            }

            const currentFilters = fieldChips
                .filter((chip) => chip.fieldName === fieldName && chip.chipType === 'filter')
                .map((chip) => chip.filterField);

            const hasFilters = currentFilters.length > 0;
            const hadFilters = !!prop.filters;

            if (hasFilters !== hadFilters) return true;

            if (hasFilters && hadFilters) {
                const originalFilters = prop.filters;
                const currentFilterObj = {
                    $or: currentFilters.map((filter) => {
                        const filterResult = filterModelToFilterOfTemplatePerField(currentField.fieldValue, fieldName, filter!);
                        return filterResult;
                    }),
                };
                return JSON.stringify(originalFilters) !== JSON.stringify(currentFilterObj);
            }

            return false;
        });

        const hasViewTypeChange = childTemplate.viewType !== childTemplateViewType;
        const hasUserFilterChange = childTemplate.isFilterByCurrentUser !== childTemplateFilterByCurrentUser;
        const hasUnitFilterChange = childTemplate.isFilterByUserUnit !== childTemplateFilterByUserUnit;
        const hasUserFieldFilterChange =
            !childTemplate.filterByCurrentUserField && !userField.selectedUserField
                ? false
                : childTemplate.filterByCurrentUserField !== userField.selectedUserField;
        const hasUnitUserFieldFilterChange =
            !childTemplate.filterByUnitUserField && !unitUserField.selectedUnitUserField
                ? false
                : childTemplate.filterByUnitUserField !== unitUserField.selectedUnitUserField;

        setHasChanges(
            hasFieldChanges ||
                hasCategoryChanges ||
                hasFilterOrDefaultChanges ||
                hasViewTypeChange ||
                hasUserFilterChange ||
                hasUnitFilterChange ||
                hasUserFieldFilterChange ||
                hasUnitUserFieldFilterChange,
        );
    }, [
        childTemplate,
        templateFieldsFilters,
        selectedCategory,
        fieldChips,
        childTemplateViewType,
        childTemplateFilterByCurrentUser,
        childTemplateFilterByUserUnit,
        userField.selectedUserField,
        unitUserField.selectedUnitUserField,
    ]);

    const handleCheckboxChange = (fieldName: string, checked: boolean) => {
        const newFieldFilters = { ...templateFieldsFilters };
        if (!checked) {
            newFieldFilters[fieldName].isEditableByUser = false;
        }

        newFieldFilters[fieldName].selected = checked;

        setTemplateFieldsFilters(newFieldFilters);
    };

    if (!entityTemplate || !categories || !allTemplates) return null;
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

    const isUpdate = !!childTemplate?.displayName;

    const replaceNamePrefix = (childTemplate: IMongoChildTemplatePopulated) => ({
        ...childTemplate,
        name: childTemplate.name.replace(`${entityTemplate.name}_`, ''),
        displayName: childTemplate.displayName.replace(`${entityTemplate.displayName}-`, ''),
        category: childTemplate._id ? childTemplate.category : entityTemplate.category,
    });

    return (
        <Dialog open={open} maxWidth="md" fullWidth disableEnforceFocus>
            <Formik
                initialValues={replaceNamePrefix(childTemplate ?? emptyChildTemplate)}
                validationSchema={createChildTemplateSchema(existingNames, existingDisplayNames)}
                onSubmit={async ({ name, displayName, description, category }) => {
                    if (matchValidationError.size > 0 || !hasCheckedBox) return;

                    const latestFields = Object.entries(templateFieldsFilters);

                    const properties: IChildTemplate['properties'] = { properties: {} };

                    latestFields.forEach(([fieldName, fieldConfig]) => {
                        const filterChips = fieldChips.filter((chip) => chip.fieldName === fieldName && chip.chipType === 'filter');
                        const filtersArray = filterChips.map((chip) =>
                            filterModelToFilterOfTemplatePerField(fieldConfig.fieldValue, fieldName, chip.filterField!),
                        );

                        const childProp: IChildTemplateProperty = {
                            ...(childTemplateViewType === ViewType.userPage && { isEditableByUser: fieldConfig.isEditableByUser || false }),
                            ...(filterChips.length > 0 && { filters: { $or: filtersArray } }),
                            ...('defaultValue' in fieldConfig &&
                                fieldConfig.defaultValue !== undefined && { defaultValue: fieldConfig.defaultValue }),
                            display: fieldConfig.selected,
                        };

                        properties.properties[fieldName] = childProp;
                    });

                    properties.properties = Object.fromEntries(
                        Object.entries(properties.properties).filter(
                            ([_key, { display, filters, defaultValue }]) =>
                                display === true || (display === false && (defaultValue !== undefined || filters !== undefined)),
                        ),
                    );

                    const baseTemplate: IChildTemplate = {
                        name: `${entityTemplate.name}_${name}`,
                        displayName: `${entityTemplate.displayName}-${displayName}`,
                        description,
                        parentTemplateId: entityTemplate._id,
                        category: category!._id,
                        properties,
                        disabled: false,
                        viewType: childTemplateViewType,
                        isFilterByCurrentUser: childTemplateFilterByCurrentUser,
                        isFilterByUserUnit: childTemplateFilterByUserUnit,
                        filterByCurrentUserField: userField.selectedUserField || undefined,
                        filterByUnitUserField: unitUserField.selectedUnitUserField || undefined,
                    };

                    localStorage.removeItem(`${columnWidths}category-${childTemplate?._id ?? entityTemplate._id}`);
                    if (childTemplate) {
                        await handleChildTemplate([baseTemplate, childTemplate._id]);
                    } else {
                        await handleChildTemplate(baseTemplate);
                    }
                }}
            >
                {(formikProps) => {
                    const { values, handleChange, touched, errors, setFieldValue, dirty } = formikProps;

                    useEffect(() => {
                        if (!childTemplate) return;

                        const hasDisplayNameChange = values.displayName !== (childTemplate.displayName || '');
                        const hasDescriptionChange = values.description !== (childTemplate.description || '');
                        const hasCategoryChange = JSON.stringify(values.category?._id) !== JSON.stringify(childTemplate.category);

                        if (hasDescriptionChange || hasCategoryChange || hasDisplayNameChange) {
                            setHasChanges(true);
                        }
                    }, [values.description, values.category, values.displayName, templateFieldsFilters]);

                    return (
                        <Form>
                            <DialogTitle>
                                {`${i18next.t(`childTemplate.${isUpdate ? 'updateTemplate' : 'template'}Title`)}- ${
                                    childTemplate ? childTemplate.displayName : entityTemplate.displayName
                                }`}
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
                                    <CloseIcon />
                                </IconButton>
                            </DialogTitle>
                            <DialogContent>
                                <Grid container spacing={2} direction="column" sx={{ pt: 2 }}>
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
                                                disabled={isUpdate}
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
                                                    value={childTemplateViewType}
                                                    onChange={(e) => {
                                                        const { value } = e.target;
                                                        setChildTemplateViewType(value as ViewType);

                                                        if (value === ViewType.categoryPage) {
                                                            setTemplateFieldsFilters((prev) => {
                                                                const newFilters = { ...prev };
                                                                Object.keys(newFilters).forEach((key) => {
                                                                    if (newFilters[key].isEditableByUser) {
                                                                        newFilters[key] = {
                                                                            ...newFilters[key],
                                                                            isEditableByUser: false,
                                                                        };
                                                                    }
                                                                });
                                                                return newFilters;
                                                            });
                                                        }
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
                                                                checked={childTemplateFilterByCurrentUser}
                                                                onChange={(e) => {
                                                                    setChildTemplateFilterByCurrentUser(e.target.checked);
                                                                    setUserField({
                                                                        selectUserFieldDialogOpen: !!e.target.checked,
                                                                        selectedUserField: undefined,
                                                                    });
                                                                }}
                                                            />
                                                        }
                                                        label={i18next.t('childTemplate.userType.regularUser')}
                                                        componentsProps={{
                                                            typography: { sx: { fontSize: '14px' } },
                                                        }}
                                                    />
                                                    {userField.selectedUserField && (
                                                        <Typography sx={{ fontSize: '12px', color: 'text.secondary', ml: 4 }}>
                                                            {`${i18next.t('childTemplate.selectUserDialog.byUser')} : ${
                                                                entityTemplate.properties.properties[userField.selectedUserField].title
                                                            }`}
                                                        </Typography>
                                                    )}
                                                </Grid>
                                            )}
                                            {hasUnitTypeProperty && (
                                                <Grid item>
                                                    <FormControlLabel
                                                        control={
                                                            <MeltaCheckbox
                                                                checked={childTemplateFilterByUserUnit}
                                                                onChange={(e) => {
                                                                    setChildTemplateFilterByUserUnit(e.target.checked);
                                                                    setUnitUserField({
                                                                        selectUnitUserFieldDialogOpen: !!e.target.checked,
                                                                        selectedUnitUserField: undefined,
                                                                    });
                                                                }}
                                                            />
                                                        }
                                                        label={i18next.t('childTemplate.userType.specialUser')}
                                                        componentsProps={{
                                                            typography: { sx: { fontSize: '14px' } },
                                                        }}
                                                    />
                                                    {unitUserField.selectedUnitUserField && (
                                                        <Typography sx={{ fontSize: '12px', color: 'text.secondary', ml: 4 }}>
                                                            {`${i18next.t('childTemplate.selectUserUnitDialog.label')} : ${
                                                                entityTemplate.properties.properties[unitUserField.selectedUnitUserField].title
                                                            }`}
                                                        </Typography>
                                                    )}
                                                </Grid>
                                            )}
                                        </Grid>
                                    </Grid>

                                    <Grid container sx={{ pt: 3, pl: 2 }} alignItems="center" justifyContent="space-between">
                                        <Grid item xs={6}>
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
                                                            <ColoredEnumChip label={category.displayName} color="default" />
                                                        </li>
                                                    )}
                                                />
                                            </FormControl>
                                        </Grid>
                                        {hasUnitTypeProperty && (
                                            <Grid item xs={5.5}>
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
                                        <Grid item xs={12}>
                                            <Typography
                                                sx={{ fontWeight: 400, fontSize: '16px', mb: isEmpty(touched) || hasCheckedBox ? '19px' : '0px' }}
                                            >
                                                {i18next.t('childTemplate.columns.title')}
                                            </Typography>
                                            {!isEmpty(touched) && !hasCheckedBox && (
                                                <Typography sx={{ fontSize: '12px', color: 'error.main', mb: '19px' }}>
                                                    {i18next.t('childTemplate.fieldFilterTableNoChecks')}
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
                                                {childTemplateViewType === ViewType.userPage && (
                                                    <Grid item xs={3}>
                                                        <Typography sx={{ fontWeight: 400, fontSize: '14px', textAlign: 'center' }}>
                                                            {i18next.t('childTemplate.columns.filterByUserCol')}
                                                        </Typography>
                                                    </Grid>
                                                )}
                                            </Grid>

                                            <Grid item xs={12} sx={{ maxHeight: 400, overflowY: 'auto', px: 2 }}>
                                                <FieldsAndFiltersTable
                                                    entityTemplate={entityTemplate}
                                                    templateFieldsFilters={templateFieldsFilters}
                                                    setTemplateFieldsFilters={setTemplateFieldsFilters}
                                                    viewType={childTemplateViewType}
                                                    setFieldChips={setFieldChips}
                                                    fieldChips={fieldChips}
                                                    onCheckboxChange={handleCheckboxChange}
                                                    matchValidationError={matchValidationError}
                                                    setMatchValidationError={setMatchValidationError}
                                                    selectedUserField={userField.selectedUserField}
                                                />
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </DialogContent>
                            <DialogActions sx={{ margin: '10px' }}>
                                <Grid container justifyContent="center">
                                    {isUpdate && (
                                        <Button sx={{ borderRadius: '7px', padding: '6.99px 10px' }} onClick={handleClose}>
                                            {i18next.t('childTemplate.buttons.cancel')}
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        sx={{ borderRadius: '7px', padding: '6.99px 30px', fontWeight: 400 }}
                                        disabled={!dirty || isLoading || (isUpdate && !hasChanges) || matchValidationError.size > 0}
                                    >
                                        {i18next.t(`actions.${isUpdate ? 'save' : 'create'}`)}
                                    </Button>
                                </Grid>
                            </DialogActions>
                        </Form>
                    );
                }}
            </Formik>
            <SelectUserFieldDialog
                open={userField.selectUserFieldDialogOpen}
                userFields={userFields}
                selectedField={userField.selectedUserField || null}
                onClose={() => {
                    setUserField({
                        selectedUserField: undefined,
                        selectUserFieldDialogOpen: false,
                    });
                    setChildTemplateFilterByCurrentUser(false);
                }}
                onSubmit={(field) => {
                    setUserField({
                        selectedUserField: field,
                        selectUserFieldDialogOpen: false,
                    });
                }}
                entityTemplate={entityTemplate}
            />
            <SelectUserFieldDialog
                open={unitUserField.selectUnitUserFieldDialogOpen}
                userFields={unitFields}
                selectedField={unitUserField.selectedUnitUserField || null}
                onClose={() => {
                    setUnitUserField({
                        selectedUnitUserField: undefined,
                        selectUnitUserFieldDialogOpen: false,
                    });
                    setChildTemplateFilterByUserUnit(false);
                }}
                onSubmit={(field) => {
                    setUnitUserField({
                        selectedUnitUserField: field,
                        selectUnitUserFieldDialogOpen: false,
                    });
                }}
                entityTemplate={entityTemplate}
                title={i18next.t('childTemplate.selectUserUnitDialog.title')}
                content={i18next.t('childTemplate.selectUserUnitDialog.content')}
                label={i18next.t('childTemplate.selectUserUnitDialog.label')}
            />
        </Dialog>
    );
};

export default CreateChildTemplateDialog;
