/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useState } from 'react';
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
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { ICategoryMap, IMongoCategory } from '../../../interfaces/categories';
import { ColoredEnumChip } from '../../ColoredEnumChip';
import { IAGGidNumberFilter, IAGGridDateFilter, IAGGridSetFilter, IAGGridTextFilter } from '../../../utils/agGrid/interfaces';
import FieldsAndFiltersTable from './FieldsAndFiltersTable';
import { MeltaCheckbox } from '../../MeltaCheckbox';
import SelectUserFieldDialog from './SelectUserFieldDialog';
import { filterModelToFilterOfTemplatePerField } from '../../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { createEntityChildTemplateRequest } from '../../../services/templates/entityChildTemplatesService';
import { ErrorToast } from '../../ErrorToast';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';

export interface IFieldFilter {
    fieldValue: IEntitySingleProperty;
    selected: boolean;
    filterField?: IAGGridTextFilter | IAGGidNumberFilter | IAGGridDateFilter | IAGGridSetFilter;
}

export enum ViewType {
    categoryPage = 'categoryPage',
    userPage = 'userPage',
}

export interface IEntityChildTemplate {
    name: string;
    displayName: string;
    description: string;
    fatherTemplateId: string;
    categories: IMongoCategory['_id'][];
    properties: Record<string, unknown>;
    disabled: boolean;
    actions?: string;
    viewType: ViewType;
    defaults: Record<string, string | number | boolean | Date | string[]>;
    filters: Record<string, unknown>;
    isFilterByCurrentUser: boolean;
    isFilterByUserUnit: boolean;
}

export interface IMongoEntityChildTemplate extends IEntityChildTemplate {
    _id: string;
}

export interface ITemplateFieldsFilters {
    [key: string]: IFieldFilter;
}

const CreateChildTemplateDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    entityTemplate: IMongoEntityTemplatePopulated | null;
}> = ({ open, handleClose, entityTemplate }) => {
    if (!entityTemplate) return null;

    const queryClient = useQueryClient();
    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;

    const [childTemplateName, setChildTemplateName] = useState<string>('');
    const [childTemplateDisplayName, setChildTemplateDisplayName] = useState<string>('');
    const [childTemplateDescription, setChildTemplateDescription] = useState<string>('');
    const [childTemplateViewType, setChildTemplateViewType] = useState<ViewType>(ViewType.categoryPage);
    const [childTemplateFilterByCurrentUser, setChildTemplateFilterByCurrentUser] = useState<boolean>(false);
    const [childTemplateFilterByUserUnit, setChildTemplateFilterByUserUnit] = useState<boolean>(false);
    const [selectedCategories, setSelectedCategories] = useState<IMongoCategory[]>(entityTemplate!.category ? [entityTemplate!.category] : []);
    const [templateFieldsFilters, setTemplateFieldsFilters] = useState<ITemplateFieldsFilters>({});
    const [selectUserFieldDialogOpen, setSelectUserFieldDialogOpen] = useState(false);
    const [selectedUserField, setSelectedUserField] = useState<string | null>(null);

    const initFieldFilters = () => {
        const newTemplateFieldsFilters: ITemplateFieldsFilters = {};
        Object.entries(entityTemplate.properties.properties).forEach(([fieldName, fieldValue]) => {
            newTemplateFieldsFilters[fieldName] = {
                selected: false,
                fieldValue,
            };
        });
        setTemplateFieldsFilters(newTemplateFieldsFilters);
    };
    const userFields = React.useMemo(() => {
        return entityTemplate
            ? Object.entries(entityTemplate.properties.properties)
                  .filter(([_, prop]) => prop.format === 'user')
                  .map(([key]) => key)
            : [];
    }, [entityTemplate]);

    useEffect(() => {
        if (entityTemplate) {
            initFieldFilters();
        }
    }, [entityTemplate]);

    const { mutateAsync: createEntityChildTemplate } = useMutation(
        (newEntityChildTemplate: IEntityChildTemplate) => createEntityChildTemplateRequest(newEntityChildTemplate),
        {
            onError: (err: AxiosError) => {
                console.error('failed to create entity child template. error:', err);
                toast.error(
                    <ErrorToast axiosError={err} defaultErrorMessage={i18next.t('createChildTemplateDialog.failedToCreateEntityChildTemplate')} />,
                );
            },
            onSuccess: (_data: IMongoEntityChildTemplate) => {
                toast.success(i18next.t('createChildTemplateDialog.succeededToCreateEntityChildTemplate'));
                queryClient.invalidateQueries('getEntityChildTemplates');
                handleClose();
            },
        },
    );

    const handleSave = async () => {
        const selectedFields = Object.entries(templateFieldsFilters).filter(([_fieldName, fieldFilter]) => fieldFilter.selected);

        const filters = selectedFields
            .map(([fieldName, fieldConfig]) => {
                if (!fieldConfig.filterField) return null;
                try {
                    return filterModelToFilterOfTemplatePerField(fieldConfig.fieldValue, fieldName, fieldConfig.filterField);
                } catch (e) {
                    console.error(`Error creating filter for ${fieldName}:`, e);
                    return null;
                }
            })
            .filter(Boolean);

        const defaults: IEntityChildTemplate['defaults'] = {};
        const properties: IEntityChildTemplate['properties'] = {};

        selectedFields.forEach(([fieldName, fieldConfig]) => {
            properties[fieldName] = fieldConfig.fieldValue;
        });

        const newChildTemplate: IEntityChildTemplate = {
            name: childTemplateName,
            displayName: childTemplateDisplayName,
            description: childTemplateDescription,
            fatherTemplateId: entityTemplate._id,
            categories: selectedCategories.map((category) => category._id),
            properties,
            disabled: false,
            actions: entityTemplate.actions,
            viewType: childTemplateViewType,
            defaults,
            filters: filters.length ? { $and: filters } : {},
            isFilterByCurrentUser: childTemplateFilterByCurrentUser,
            isFilterByUserUnit: childTemplateFilterByUserUnit,
        };

        createEntityChildTemplate(newChildTemplate);
    };

    const hasUserTypeProperty = React.useMemo(() => {
        return Object.values(entityTemplate.properties.properties).some((property) => property.format === 'user');
    }, [entityTemplate]);

    const hasUnitTypeProperty = React.useMemo(() => {
        return Object.values(entityTemplate.properties.properties).some((property) => property.format === 'unitField');
    }, [entityTemplate]);

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 400, fontSize: '16px' }}>{entityTemplate?.displayName}</DialogTitle>

            <DialogContent>
                <Grid container direction="column">
                    <Grid container sx={{ pt: 3 }} alignItems="center" justifyContent="space-between">
                        <Grid xs={6} item container direction="column" justifyContent="space-between">
                            <Grid xs={6} item>
                                <TextField
                                    fullWidth
                                    label={i18next.t('createChildTemplateDialog.templateDisplayName')}
                                    onChange={(e) => setChildTemplateDisplayName(e.target.value)}
                                    value={childTemplateDisplayName}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">{entityTemplate.displayName} -</InputAdornment>,
                                    }}
                                />
                            </Grid>
                            <Grid xs={6} sx={{ pt: 3 }} item>
                                <TextField
                                    fullWidth
                                    label={i18next.t('createChildTemplateDialog.templateName')}
                                    onChange={(e) => setChildTemplateName(e.target.value)}
                                    value={childTemplateName}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">{entityTemplate.name}_</InputAdornment>,
                                    }}
                                />
                            </Grid>
                        </Grid>
                        <Grid xs={5.5} item>
                            <TextField
                                label={i18next.t('createChildTemplateDialog.templateDetails')}
                                multiline
                                fullWidth
                                rows={1}
                                dir="rtl"
                                variant="outlined"
                                onChange={(e) => setChildTemplateDescription(e.target.value)}
                                value={childTemplateDescription}
                            />
                        </Grid>
                    </Grid>

                    <Grid container direction="row" sx={{ pt: 3 }} alignItems="center" justifyContent="space-between">
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

                    <Grid container sx={{ pt: 3 }} alignItems="center" justifyContent="space-between">
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <Autocomplete
                                    id="category"
                                    options={Array.from(categories.values())}
                                    multiple
                                    disableCloseOnSelect
                                    onChange={(event, newVal) => {
                                        event.preventDefault();
                                        setSelectedCategories(newVal.length ? newVal : []);
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
                                            <ColoredEnumChip
                                                label={category.displayName}
                                                color="default"
                                                // style={{ backgroundColor: '#EBEFFA', borderRadius: '10px' }}
                                            />
                                        </li>
                                    )}
                                    renderTags={(tagValue, getTagProps) =>
                                        tagValue.map((category, index) => {
                                            const { key, onDelete, ...restTagProps } = getTagProps({ index });
                                            return (
                                                <ColoredEnumChip
                                                    key={key}
                                                    label={category.displayName}
                                                    color="default"
                                                    onDelete={onDelete}
                                                    {...restTagProps}
                                                    style={{
                                                        margin: '0 4px 4px 0',
                                                        borderRadius: '10px',
                                                        // backgroundColor: '#EBEFFA',
                                                    }}
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
                            <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
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

                            <Grid item xs={12} sx={{ maxHeight: 400, overflowY: 'auto', pr: 3 }}>
                                <FieldsAndFiltersTable
                                    entityTemplate={entityTemplate}
                                    templateFieldsFilters={templateFieldsFilters}
                                    setTemplateFieldsFilters={setTemplateFieldsFilters}
                                    viewType={childTemplateViewType}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', marginBottom: '10px' }}>
                {/* <Button onClick={handleClose}>{i18next.t('actions.cancel')}</Button> */}
                <Button onClick={handleSave} variant="contained" color="primary" sx={{ minWidth: '100px' }}>
                    {i18next.t('actions.create')}
                </Button>
            </DialogActions>
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
