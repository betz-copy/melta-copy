/* eslint-disable react-hooks/rules-of-hooks */
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
    InputAdornment,
    Radio,
    RadioGroup,
    TextField,
    Typography,
} from '@mui/material';
import { AxiosError } from 'axios';
import { Form, Formik } from 'formik';
import i18next from 'i18next';
import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { environment } from '../../../globals';
import { ICategoryMap, IMongoCategory } from '../../../interfaces/categories';
import {
    ChipType,
    IChildTemplateProperty,
    IChildTemplate,
    IChildTemplateMap,
    IFieldChip,
    IMongoChildTemplate,
    IFieldFilter,
    ITemplateFieldsFilters,
    ViewType,
    IMongoChildTemplatePopulated,
} from '../../../interfaces/childTemplates';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { createChildTemplate, updateChildTemplate } from '../../../services/templates/childTemplatesService';
import { filterModelToFilterOfTemplatePerField } from '../../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { IAGGidNumberFilter, IAGGridDateFilter, IAGGridSetFilter, IAGGridTextFilter } from '../../../utils/agGrid/interfaces';
import { ColoredEnumChip } from '../../ColoredEnumChip';
import { ErrorToast } from '../../ErrorToast';
import { MeltaCheckbox } from '../../MeltaCheckbox';
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

    const [selectUserFieldDialogOpen, setSelectUserFieldDialogOpen] = useState(false);
    const [selectedUserField, setSelectedUserField] = useState<string | null>(childTemplate?.filterByCurrentUserField || null);
    const [templateFieldsFilters, setTemplateFieldsFilters] = useState<ITemplateFieldsFilters>({});
    const [childTemplateFilterByCurrentUser, setChildTemplateFilterByCurrentUser] = useState(childTemplate?.isFilterByCurrentUser || false);
    const [childTemplateFilterByUserUnit, setChildTemplateFilterByUserUnit] = useState(childTemplate?.isFilterByUserUnit || false);
    const [selectedCategory, setSelectedCategory] = useState<IMongoCategory>();
    const [childTemplateViewType, setChildTemplateViewType] = useState<ViewType>(childTemplate?.viewType || ViewType.categoryPage);
    const [fieldChips, setFieldChips] = useState<IFieldChip[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (entityTemplate) {
            const initialFields: ITemplateFieldsFilters = {};
            Object.entries(entityTemplate.properties.properties).forEach(([key, value]) => {
                const isRequired = entityTemplate.properties.required.includes(key);
                const property = childTemplate?.properties.properties[key];
                const isSelected = (childTemplate ? key in childTemplate.properties.properties : false) || isRequired;
                const defaultValue = property?.defaultValue;
                const isEditableByUser = property?.isEditableByUser;

                initialFields[key] = {
                    selected: isSelected,
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
        if (childTemplate) {
            const chips: IFieldChip[] = [];
            Object.entries(childTemplate.properties.properties).forEach(([fieldName, prop]) => {
                if (prop.filters) {
                    try {
                        const parsedFilters = typeof prop.filters === 'string' ? JSON.parse(prop.filters) : prop.filters;
                        if (parsedFilters.$or) {
                            parsedFilters.$or.forEach((filter: IFieldFilter) => {
                                const fieldValue = filter[fieldName];
                                let filterType = '';
                                let value = '';

                                if (fieldValue.$rgx) {
                                    filterType = 'contains';
                                    value = fieldValue.$rgx.replace(/\.\*/g, '');
                                } else if (fieldValue.$eq !== undefined) {
                                    filterType = 'equals';
                                    value = fieldValue.$eq;
                                } else if (fieldValue.$ne !== undefined) {
                                    filterType = 'notEqual';
                                    value = fieldValue.$ne;
                                } else if (fieldValue.$lt !== undefined) {
                                    filterType = 'lessThan';
                                    value = fieldValue.$lt;
                                } else if (fieldValue.$lte !== undefined) {
                                    filterType = 'lessThanOrEqual';
                                    value = fieldValue.$lte;
                                } else if (fieldValue.$gt !== undefined) {
                                    filterType = 'greaterThan';
                                    value = fieldValue.$gt;
                                } else if (fieldValue.$gte !== undefined) {
                                    filterType = 'greaterThanOrEqual';
                                    value = fieldValue.$gte;
                                } else if (fieldValue.$in) {
                                    filterType = 'in';
                                    value = fieldValue.$in.join(', ');
                                } else if (fieldValue.$eq === null) {
                                    filterType = 'blank';
                                    value = '';
                                } else if (fieldValue.$ne === null) {
                                    filterType = 'notBlank';
                                    value = '';
                                } else if (fieldValue.$startsWith) {
                                    filterType = 'startsWith';
                                    value = fieldValue.$startsWith;
                                } else if (fieldValue.$endsWith) {
                                    filterType = 'endsWith';
                                    value = fieldValue.$endsWith;
                                } else if (fieldValue.$notContains) {
                                    filterType = 'notContains';
                                    value = fieldValue.$notContains;
                                }

                                const fieldTemplate = entityTemplate.properties.properties[fieldName];
                                const filterTypeObj: IAGGridTextFilter | IAGGidNumberFilter | IAGGridDateFilter | IAGGridSetFilter = (() => {
                                    if (fieldValue.$in) {
                                        return {
                                            filterType: 'set',
                                            values: fieldValue.$in,
                                        };
                                    }

                                    if (fieldTemplate.type === 'number') {
                                        return {
                                            filterType: 'number',
                                            type: filterType as IAGGidNumberFilter['type'],
                                            filter: typeof value === 'string' ? parseFloat(value) : value,
                                        };
                                    }

                                    if (fieldTemplate.format === 'date' || fieldTemplate.format === 'date-time') {
                                        return {
                                            filterType: 'date',
                                            type: filterType as IAGGridDateFilter['type'],
                                            dateFrom: value,
                                            dateTo: null,
                                        };
                                    }

                                    return {
                                        filterType: 'text',
                                        type: filterType as IAGGridTextFilter['type'],
                                        filter: String(value),
                                    };
                                })();

                                chips.push({
                                    fieldName,
                                    chipType: ChipType.Filter,
                                    defaultValue: `${i18next.t(`filters.${filterType}`)}: ${value}`,
                                    filterField: filterTypeObj,
                                });
                            });
                        }
                    } catch (e) {
                        console.error('Error parsing filters:', e);
                    }
                }

                if (prop.defaultValue !== undefined) {
                    const defaultValue = prop.defaultValue;
                    let displayValue = defaultValue;

                    const fieldTemplate = entityTemplate.properties.properties[fieldName];
                    if (fieldTemplate.format === 'date-time' || fieldTemplate.format === 'date') {
                        try {
                            const date = new Date(defaultValue);
                            if (!isNaN(date.getTime())) {
                                displayValue = date.toLocaleDateString();
                            }
                        } catch (e) {
                            console.error('Error formatting date:', e);
                            displayValue = defaultValue;
                        }
                    }

                    chips.push({
                        fieldName,
                        chipType: ChipType.Default,
                        defaultValue: displayValue,
                    });
                }
            });

            setFieldChips(chips);
        }
    }, [childTemplate]);

    const userFields = useMemo(() => {
        return entityTemplate
            ? Object.entries(entityTemplate.properties.properties)
                  .filter(([_, prop]) => prop.format === 'user')
                  .map(([key]) => key)
            : [];
    }, [entityTemplate]);

    const hasUnitTypeProperty = useMemo(
        () => Object.values(entityTemplate?.properties.properties || {}).some((property) => property.format === 'unitField'),
        [entityTemplate],
    );

    const { mutateAsync: handleChildTemplate } = useMutation<IMongoChildTemplate, AxiosError, IChildTemplate | [IChildTemplate, string]>({
        mutationFn: (template) => {
            if (Array.isArray(template)) {
                const [templateData, id] = template;
                return updateChildTemplate(id, templateData);
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
                toast.success(i18next.t(`createChildTemplateDialog.succeededTo${childTemplate ? 'Update' : 'Create'}ChildTemplate`));
                handleClose();
            });
        },
        onError: (err: AxiosError) => {
            toast.error(
                <ErrorToast
                    axiosError={err}
                    defaultErrorMessage={i18next.t(`createChildTemplateDialog.failedTo${childTemplate ? 'Update' : 'Create'}ChildTemplate`)}
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

        setHasChanges(
            hasFieldChanges || hasCategoryChanges || hasFilterOrDefaultChanges || hasViewTypeChange || hasUserFilterChange || hasUnitFilterChange,
        );
    }, [
        childTemplate,
        templateFieldsFilters,
        selectedCategory,
        fieldChips,
        childTemplateViewType,
        childTemplateFilterByCurrentUser,
        childTemplateFilterByUserUnit,
    ]);

    const handleCheckboxChange = (fieldName: string, checked: boolean) => {
        const newFieldFilters = { ...templateFieldsFilters };
        if (!checked) {
            setFieldChips((prev) => prev.filter((chip) => chip.fieldName !== fieldName));
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

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <Formik
                initialValues={{
                    name: childTemplate ? childTemplate.name.replace(`${entityTemplate.name}_`, '') : '',
                    displayName: childTemplate ? childTemplate.displayName.replace(`${entityTemplate.displayName}-`, '') : '',
                    description: childTemplate?.description || '',
                    category: selectedCategory,
                    isFilterByCurrentUser: childTemplate?.isFilterByCurrentUser || false,
                    isFilterByUserUnit: childTemplate?.isFilterByUserUnit || false,
                    filterByCurrentUserField: childTemplate?.filterByCurrentUserField || undefined,
                }}
                validationSchema={createChildTemplateSchema(existingNames, existingDisplayNames)}
                onSubmit={async ({ name, displayName, description, category }) => {
                    const fullName = `${entityTemplate.name}_${name}`;
                    const displayNameToUse = childTemplate ? childTemplate.displayName : `${entityTemplate.displayName}-${displayName}`;
                    const latestFields = Object.entries(templateFieldsFilters).filter(([_, field]) => field.selected);

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
                        };

                        properties.properties[fieldName] = childProp;
                    });

                    const baseTemplate: IChildTemplate = {
                        name: fullName,
                        displayName: displayNameToUse,
                        description,
                        parentTemplateId: entityTemplate._id,
                        category: category!._id,
                        properties,
                        disabled: false,
                        viewType: childTemplateViewType,
                        isFilterByCurrentUser: childTemplateFilterByCurrentUser,
                        isFilterByUserUnit: childTemplateFilterByUserUnit,
                        filterByCurrentUserField: selectedUserField || undefined,
                    };

                    localStorage.removeItem(`${columnWidths}category-${childTemplate?._id ?? entityTemplate._id}`);
                    if (childTemplate) {
                        await handleChildTemplate([baseTemplate, childTemplate._id]);
                    } else {
                        await handleChildTemplate(baseTemplate);
                    }
                }}
            >
                {({ values, handleChange, touched, errors, setFieldValue }) => {
                    useEffect(() => {
                        if (!childTemplate) return;

                        const hasDescriptionChange = values.description !== (childTemplate.description || '');
                        const hasCategoryChange = JSON.stringify(values.category?._id) !== JSON.stringify(childTemplate.category);

                        if (hasDescriptionChange || hasCategoryChange) {
                            setHasChanges(true);
                        }
                    }, [values.description, values.category]);

                    return (
                        <Form>
                            <DialogTitle>
                                {`${i18next.t(`createChildTemplateDialog.${childTemplate ? 'updateTemplate' : 'template'}Title`)}- ${
                                    childTemplate ? childTemplate.displayName : entityTemplate.displayName
                                }`}
                            </DialogTitle>
                            <DialogContent>
                                <Grid container spacing={2} direction="column" sx={{ pt: 2 }}>
                                    <Grid container item spacing={2}>
                                        <Grid item xs={6}>
                                            <TextField
                                                fullWidth
                                                label={i18next.t('createChildTemplateDialog.templateName')}
                                                name="name"
                                                value={values.name.trimStart()}
                                                onChange={(e) => handleChange({ target: { name: 'name', value: e.target.value.trimStart() } })}
                                                error={touched.name && Boolean(errors.name)}
                                                helperText={touched.name && errors.name}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">{entityTemplate.name}_</InputAdornment>,
                                                }}
                                                disabled={!!childTemplate}
                                            />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <TextField
                                                fullWidth
                                                label={i18next.t('createChildTemplateDialog.templateDisplayName')}
                                                name="displayName"
                                                value={values.displayName.trimStart()}
                                                onChange={(e) => handleChange({ target: { name: 'displayName', value: e.target.value.trimStart() } })}
                                                error={touched.displayName && Boolean(errors.displayName)}
                                                helperText={touched.displayName && errors.displayName}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">{entityTemplate.displayName}-</InputAdornment>,
                                                }}
                                                disabled={!!childTemplate}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label={i18next.t('createChildTemplateDialog.templateDetails')}
                                                name="description"
                                                value={values.description}
                                                onChange={handleChange}
                                                error={touched.description && Boolean(errors.description)}
                                                helperText={touched.description && errors.description}
                                                multiline
                                                rows={2}
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
                                                        label={i18next.t('createChildTemplateDialog.status.categoryPage')}
                                                        componentsProps={{
                                                            typography: { sx: { fontSize: '14px' } },
                                                        }}
                                                    />
                                                    <FormControlLabel
                                                        value="userPage"
                                                        control={<Radio />}
                                                        label={i18next.t('createChildTemplateDialog.status.userPage')}
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
                                                                    if (e.target.checked) setSelectUserFieldDialogOpen(true);
                                                                    else setSelectedUserField(null);
                                                                }}
                                                            />
                                                        }
                                                        label={i18next.t('createChildTemplateDialog.userType.regularUser')}
                                                        componentsProps={{
                                                            typography: { sx: { fontSize: '14px' } },
                                                        }}
                                                    />
                                                    {selectedUserField && (
                                                        <Typography sx={{ fontSize: '12px', color: 'text.secondary', ml: 4 }}>
                                                            {`${i18next.t(
                                                                'createChildTemplateDialog.selectUserDialog.byUser',
                                                            )} : ${selectedUserField}`}
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
                                                                onChange={(e) => setChildTemplateFilterByUserUnit(e.target.checked)}
                                                            />
                                                        }
                                                        label={i18next.t('createChildTemplateDialog.userType.specialUser')}
                                                        componentsProps={{
                                                            typography: { sx: { fontSize: '14px' } },
                                                        }}
                                                    />
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
                                                    disableCloseOnSelect
                                                    onChange={(event, newVal) => {
                                                        event.preventDefault();
                                                        setFieldValue('category', newVal);
                                                    }}
                                                    value={values.category}
                                                    getOptionLabel={(option) => option.displayName}
                                                    isOptionEqualToValue={(option, value) => option._id === value._id}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            fullWidth
                                                            name="category"
                                                            variant="outlined"
                                                            label={i18next.t('createChildTemplateDialog.categoryType.relatedToLabel')}
                                                            error={touched.category && Boolean(errors.category)}
                                                            helperText={touched.category && errors.category}
                                                        />
                                                    )}
                                                    renderOption={(props, category) => (
                                                        <li {...props} key={category._id}>
                                                            <ColoredEnumChip label={category.displayName} color="default" />
                                                        </li>
                                                    )}
                                                    renderTags={(tagValue, getTagProps) =>
                                                        tagValue.map((category, index) => {
                                                            const { key, onDelete, ...restTagProps } = getTagProps({ index });
                                                            const isOriginal = category._id === entityTemplate?.category?._id;

                                                            return (
                                                                <ColoredEnumChip
                                                                    key={key}
                                                                    label={category.displayName}
                                                                    color="default"
                                                                    {...restTagProps}
                                                                    style={{
                                                                        margin: '0 4px 4px 0',
                                                                        borderRadius: '10px',
                                                                        opacity: isOriginal ? 0.8 : 1,
                                                                    }}
                                                                    onDelete={onDelete}
                                                                />
                                                            );
                                                        })
                                                    }
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
                                                    value={i18next.t('createChildTemplateDialog.connectToUserPage')}
                                                    disabled
                                                />
                                            </Grid>
                                        )}
                                    </Grid>

                                    <Grid container sx={{ pt: 4 }} alignSelf="center" width="98%" justifyContent="space-between">
                                        <Grid item xs={12}>
                                            <Typography sx={{ fontWeight: 400, fontSize: '16px', marginBottom: '19px' }}>
                                                {i18next.t('createChildTemplateDialog.columns.title')}
                                            </Typography>
                                            <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 1.5, pl: 2 }}>
                                                <Grid item xs={3}>
                                                    <Typography sx={{ fontWeight: 400, fontSize: '14px' }}>
                                                        {i18next.t('createChildTemplateDialog.columns.nameCol')}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <Typography sx={{ fontWeight: 400, fontSize: '14px', textAlign: 'center' }}>
                                                        {i18next.t('createChildTemplateDialog.columns.filterCol')}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <Typography sx={{ fontWeight: 400, fontSize: '14px', textAlign: 'center' }}>
                                                        {i18next.t('createChildTemplateDialog.columns.defaultCol')}
                                                    </Typography>
                                                </Grid>
                                                {childTemplateViewType === ViewType.userPage && (
                                                    <Grid item xs={3}>
                                                        <Typography sx={{ fontWeight: 400, fontSize: '14px', textAlign: 'center' }}>
                                                            {i18next.t('createChildTemplateDialog.columns.filterByUserCol')}
                                                        </Typography>
                                                    </Grid>
                                                )}
                                            </Grid>

                                            <Grid item xs={12} sx={{ maxHeight: 400, overflowY: 'auto', pr: 2, pl: 2 }}>
                                                <FieldsAndFiltersTable
                                                    entityTemplate={entityTemplate}
                                                    templateFieldsFilters={templateFieldsFilters}
                                                    setTemplateFieldsFilters={setTemplateFieldsFilters}
                                                    viewType={childTemplateViewType}
                                                    setFieldChips={setFieldChips}
                                                    fieldChips={fieldChips}
                                                    onCheckboxChange={handleCheckboxChange}
                                                />
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleClose}>{i18next.t('createChildTemplateDialog.buttons.cancel')}</Button>
                                <Button type="submit" variant="contained" disabled={childTemplate && !hasChanges}>
                                    {i18next.t(`createChildTemplateDialog.buttons.${childTemplate ? 'update' : 'create'}`)}
                                </Button>
                            </DialogActions>
                        </Form>
                    );
                }}
            </Formik>
            <SelectUserFieldDialog
                open={selectUserFieldDialogOpen}
                userFields={userFields}
                selectedField={selectedUserField}
                onClose={() => {
                    setSelectedUserField(null);
                    setSelectUserFieldDialogOpen(false);
                    setChildTemplateFilterByCurrentUser(false);
                }}
                onSubmit={(field) => {
                    setSelectedUserField(field);
                    setSelectUserFieldDialogOpen(false);
                }}
            />
        </Dialog>
    );
};

export { CreateChildTemplateDialog };
