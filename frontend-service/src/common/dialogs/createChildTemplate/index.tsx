/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Button,
    Grid,
    FormControlLabel,
    Typography,
    FormControl,
    RadioGroup,
    Radio,
    Autocomplete,
    InputAdornment,
} from '@mui/material';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { ICategoryMap, IMongoCategory } from '../../../interfaces/categories';
import { ColoredEnumChip } from '../../ColoredEnumChip';
import FieldsAndFiltersTable from './FieldsAndFiltersTable';
import { MeltaCheckbox } from '../../MeltaCheckbox';
import SelectUserFieldDialog from './SelectUserFieldDialog';
import { filterModelToFilterOfTemplatePerField } from '../../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { createEntityChildTemplateRequest, updateEntityChildTemplateRequest } from '../../../services/templates/entityChildTemplatesService';
import { ErrorToast } from '../../ErrorToast';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import {
    ViewType,
    ITemplateFieldsFilters,
    IEntityChildTemplate,
    IChildTemplateProperty,
    IFieldChip,
    IEntityChildTemplateMap,
    IMongoChildEntityTemplate,
} from '../../../interfaces/entityChildTemplates';
import { Form, Formik } from 'formik';
import { createChildTemplateSchema } from './validation';

const CreateChildTemplateDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    entityTemplate: IMongoEntityTemplatePopulated | null;
    childTemplate?: IEntityChildTemplate;
}> = ({ open, handleClose, entityTemplate, childTemplate }) => {
    if (!entityTemplate) return null;

    const queryClient = useQueryClient();
    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const allTemplates = queryClient.getQueryData<Map<string, IMongoEntityTemplatePopulated>>('getEntityTemplates');

    const [selectUserFieldDialogOpen, setSelectUserFieldDialogOpen] = useState(false);
    const [selectedUserField, setSelectedUserField] = useState<string | null>(null);
    const [templateFieldsFilters, setTemplateFieldsFilters] = useState<ITemplateFieldsFilters>({});
    const [childTemplateFilterByCurrentUser, setChildTemplateFilterByCurrentUser] = useState(childTemplate?.isFilterByCurrentUser || false);
    const [childTemplateFilterByUserUnit, setChildTemplateFilterByUserUnit] = useState(childTemplate?.isFilterByUserUnit || false);
    const [selectedCategories, setSelectedCategories] = useState<IMongoCategory[]>([]);
    const [childTemplateViewType, setChildTemplateViewType] = useState<ViewType>(childTemplate?.viewType || ViewType.categoryPage);
    const [fieldChips, setFieldChips] = useState<IFieldChip[]>([]);

    useEffect(() => {
        if (entityTemplate) {
            const initialFields: ITemplateFieldsFilters = {};
            Object.entries(entityTemplate.properties.properties).forEach(([key, value]) => {
                const isSelected = childTemplate ? key in childTemplate.properties : false;
                initialFields[key] = {
                    selected: isSelected,
                    fieldValue: value,
                    ...(childTemplate?.properties[key]?.defaultValue && { defaultValue: childTemplate.properties[key].defaultValue }),
                };
            });
            setTemplateFieldsFilters(initialFields);
            setSelectedCategories(
                childTemplate?.categories
                    ? childTemplate.categories.map((id) => categories.get(id)!).filter(Boolean)
                    : entityTemplate.category
                    ? [entityTemplate.category]
                    : [],
            );
        }
    }, [entityTemplate, childTemplate, categories]);

    useEffect(() => {
        if (childTemplate) {
            const chips: IFieldChip[] = [];
            Object.entries(childTemplate.properties).forEach(([fieldName, prop]) => {
                if (prop.filters) {
                    try {
                        const parsedFilters = typeof prop.filters === 'string' ? JSON.parse(prop.filters) : prop.filters;
                        if (parsedFilters.$and) {
                            parsedFilters.$and.forEach((filter: any) => {
                                const fieldKey = Object.keys(filter)[0];
                                const filterValue = filter[fieldKey];

                                // Create a user-friendly display value
                                let displayValue = '';
                                if (filterValue.$rgx) {
                                    displayValue = `מכיל: ${filterValue.$rgx.replace(/\.\*/g, '')}`;
                                } else if (filterValue.$eq !== undefined) {
                                    displayValue = `שווה ל: ${filterValue.$eq}`;
                                } else if (filterValue.$in) {
                                    displayValue = `אחד מ: ${filterValue.$in.join(', ')}`;
                                }

                                chips.push({
                                    fieldName,
                                    chipType: 'filter',
                                    value: displayValue,
                                    filterType: filterValue,
                                });
                            });
                        }
                    } catch (e) {
                        console.error('Error parsing filters:', e);
                    }
                }
                if (prop.defaultValue !== undefined) {
                    chips.push({
                        fieldName,
                        chipType: 'default',
                        value: `ברירת מחדל: ${prop.defaultValue}`,
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

    const hasUserTypeProperty = useMemo(
        () => Object.values(entityTemplate?.properties.properties || {}).some((property) => property.format === 'user'),
        [entityTemplate],
    );

    const hasUnitTypeProperty = useMemo(
        () => Object.values(entityTemplate?.properties.properties || {}).some((property) => property.format === 'unitField'),
        [entityTemplate],
    );

    const { mutateAsync: handleEntityChildTemplate } = useMutation<IMongoChildEntityTemplate, AxiosError, IEntityChildTemplate>(
        (template: IEntityChildTemplate) => {
            if (childTemplate) {
                return updateEntityChildTemplateRequest(template._id!, template);
            }
            return createEntityChildTemplateRequest(template);
        },
        {
            onSuccess: (data) => {
                // Immediately update the cache with optimistic data
                queryClient.setQueryData<IEntityChildTemplateMap>('getChildEntityTemplates', (prevData) => {
                    const newMap = new Map(prevData || new Map());
                    newMap.set(data._id, data);
                    return newMap;
                });

                // Force refetch all related queries to ensure data consistency
                Promise.all([
                    queryClient.invalidateQueries('getChildEntityTemplates'),
                    queryClient.invalidateQueries('getEntityTemplates'),
                    queryClient.invalidateQueries('searchEntityTemplates'),
                ]).then(() => {
                    // Ensure the queries are refetched before closing
                    toast.success(
                        childTemplate
                            ? i18next.t('createChildTemplateDialog.succeededToUpdateEntityChildTemplate')
                            : i18next.t('createChildTemplateDialog.succeededToCreateEntityChildTemplate'),
                    );
                    handleClose();
                });
            },
            onError: (err: AxiosError) => {
                toast.error(
                    <ErrorToast
                        axiosError={err}
                        defaultErrorMessage={
                            childTemplate
                                ? i18next.t('createChildTemplateDialog.failedToUpdateEntityChildTemplate')
                                : i18next.t('createChildTemplateDialog.failedToCreateEntityChildTemplate')
                        }
                    />,
                );
            },
        },
    );

    if (!entityTemplate || !categories || !allTemplates) return null;

    const templateValues = Array.from(allTemplates.values());
    const existingNames = templateValues.filter((t) => !childTemplate || t._id !== childTemplate._id).map((t) => t.name);
    const existingDisplayNames = templateValues.filter((t) => !childTemplate || t._id !== childTemplate._id).map((t) => t.displayName);

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <Formik
                initialValues={{
                    name: childTemplate ? childTemplate.name.replace(`${entityTemplate.name}_`, '') : '',
                    displayName: childTemplate ? childTemplate.displayName.replace(`${entityTemplate.displayName}-`, '') : '',
                    description: childTemplate?.description || '',
                }}
                validationSchema={createChildTemplateSchema(existingNames, existingDisplayNames)}
                onSubmit={async ({ name, displayName, description }) => {
                    const fullName = `${entityTemplate.name}_${name}`;
                    const fullDisplayName = `${entityTemplate.displayName}-${displayName}`;
                    const latestFields = Object.entries(templateFieldsFilters).filter(([_, field]) => field.selected);

                    const properties: IEntityChildTemplate['properties'] = {};

                    latestFields.forEach(([fieldName, fieldConfig]) => {
                        const { title, type, format } = fieldConfig.fieldValue;

                        const childProp: IChildTemplateProperty = {
                            title,
                            type,
                            ...(format && { format }),
                        };

                        const filterChips = fieldChips.filter((chip) => chip.fieldName === fieldName && chip.chipType === 'filter');

                        if (filterChips.length > 0) {
                            const filtersArray = filterChips.map((chip) => {
                                return filterModelToFilterOfTemplatePerField(fieldConfig.fieldValue, fieldName, chip.filterType!);
                            });
                            childProp.filters = { $and: filtersArray };
                        }

                        if ('defaultValue' in fieldConfig && fieldConfig.defaultValue !== undefined) {
                            childProp.defaultValue = fieldConfig.defaultValue;
                        }

                        properties[fieldName] = childProp;
                    });

                    const baseTemplate = {
                        name: fullName,
                        displayName: fullDisplayName,
                        description,
                        fatherTemplateId: entityTemplate._id,
                        categories: selectedCategories.map((c) => c._id),
                        properties,
                        disabled: false,
                        viewType: childTemplateViewType,
                        isFilterByCurrentUser: childTemplateFilterByCurrentUser,
                        isFilterByUserUnit: childTemplateFilterByUserUnit,
                    };

                    const newChildTemplate = childTemplate ? { ...baseTemplate, _id: childTemplate._id } : baseTemplate;

                    await handleEntityChildTemplate(newChildTemplate as IEntityChildTemplate);
                }}
            >
                {({ values, handleChange, touched, errors }) => (
                    <Form>
                        <DialogTitle>
                            {childTemplate
                                ? `${i18next.t('createChildTemplateDialog.editTitle')}- ${entityTemplate.displayName}`
                                : `${i18next.t('createChildTemplateDialog.templateTitle')}- ${entityTemplate.displayName}`}
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
                                            InputProps={{ startAdornment: <InputAdornment position="start">{entityTemplate.name}_</InputAdornment> }}
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
                                        {hasUserTypeProperty && (
                                            <Grid item>
                                                <FormControlLabel
                                                    control={
                                                        <MeltaCheckbox
                                                            checked={childTemplateFilterByCurrentUser}
                                                            onChange={(e) => {
                                                                setChildTemplateFilterByCurrentUser(e.target.checked);
                                                                if (e.target.checked) setSelectUserFieldDialogOpen(true);
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
                                                        {`${i18next.t('createChildTemplateDialog.selectUserDialog.byUser')} : ${selectedUserField}`}
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
                                                multiple
                                                disableCloseOnSelect
                                                onChange={(event, newVal) => {
                                                    event.preventDefault();
                                                    const original = entityTemplate?.category;
                                                    if (!original) return;

                                                    const newSelection = newVal.some((category) => category._id === original._id)
                                                        ? newVal
                                                        : [original, ...newVal];

                                                    setSelectedCategories(newSelection);
                                                }}
                                                value={selectedCategories}
                                                getOptionLabel={(option) => option.displayName}
                                                isOptionEqualToValue={(option, value) => option._id === value._id}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        fullWidth
                                                        name="category"
                                                        variant="outlined"
                                                        label={i18next.t('createChildTemplateDialog.categoryType.relatedToLabel')}
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
                                                                {...(!isOriginal && { onDelete })}
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
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleClose}>{i18next.t('createChildTemplateDialog.buttons.cancel')}</Button>
                            <Button type="submit" variant="contained">
                                {childTemplate
                                    ? i18next.t('createChildTemplateDialog.buttons.update')
                                    : i18next.t('createChildTemplateDialog.buttons.create')}
                            </Button>
                        </DialogActions>
                    </Form>
                )}
            </Formik>
            <SelectUserFieldDialog
                open={selectUserFieldDialogOpen}
                userFields={userFields}
                selectedField={selectedUserField}
                onClose={() => setSelectUserFieldDialogOpen(false)}
                onSubmit={(field) => {
                    setSelectedUserField(field);
                    setSelectUserFieldDialogOpen(false);
                }}
            />
        </Dialog>
    );
};

export { CreateChildTemplateDialog };
