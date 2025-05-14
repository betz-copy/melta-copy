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
    IconButton,
} from '@mui/material';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import CloseIcon from '@mui/icons-material/Close';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { ICategoryMap, IMongoCategory } from '../../../interfaces/categories';
import { ColoredEnumChip } from '../../ColoredEnumChip';
import { IAGGidNumberFilter, IAGGridDateFilter, IAGGridSetFilter, IAGGridTextFilter } from '../../../utils/agGrid/interfaces';
import FieldsAndFiltersTable from './FieldsAndFiltersTable';
import { MeltaCheckbox } from '../../MeltaCheckbox';

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
    fatherTemplate: string;
    categories: string[];
    propertiesFilters: Record<string, unknown>;
    disabled: boolean;
    actions?: string;
    viewType: ViewType;
    filterByCurrentUser: boolean;
    filterByUserUnit: boolean;
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
    const [childTemplateDescription, setChildTemplateDescription] = useState<string>('');
    const [childTemplateViewType, setChildTemplateViewType] = useState<ViewType>(ViewType.categoryPage);
    const [childTemplateFilterByCurrentUser, setChildTemplateFilterByCurrentUser] = useState<boolean>(false);
    const [childTemplateFilterByUserUnit, setChildTemplateFilterByUserUnit] = useState<boolean>(false);

    const [selectedCategories, setSelectedCategories] = useState<IMongoCategory[]>(entityTemplate!.category ? [entityTemplate!.category] : []);
    const [templateFieldsFilters, setTemplateFieldsFilters] = useState<ITemplateFieldsFilters>({});

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

    useEffect(() => {
        if (entityTemplate) {
            initFieldFilters();
        }
    }, [entityTemplate]);

    const handleSave = () => {
        const newChildTemplate: IEntityChildTemplate = {
            name: childTemplateName,
            displayName: childTemplateName,
            description: childTemplateDescription,
            fatherTemplate: entityTemplate._id,
            categories: selectedCategories.map((category) => category._id),
            propertiesFilters: {},
            disabled: false,
            actions: entityTemplate.actions,
            viewType: childTemplateViewType,
            filterByCurrentUser: childTemplateFilterByCurrentUser,
            filterByUserUnit: childTemplateFilterByUserUnit,
        };

        handleClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 400, fontSize: '16px' }}>{entityTemplate?.displayName}</DialogTitle>

            <DialogContent>
                <Grid container direction="column">
                    <Grid container sx={{ pt: 3 }} alignItems="center" justifyContent="space-between">
                        <Grid xs={6} item>
                            <TextField
                                fullWidth
                                label={i18next.t('createChildTemplateDialog.templateName')}
                                onChange={(e) => setChildTemplateName(e.target.value)}
                                value={childTemplateName}
                                InputLabelProps={{ sx: { fontSize: '14px', fontWeight: 400 } }}
                                InputProps={{
                                    sx: { fontSize: '14px', fontWeight: 400 },
                                    startAdornment: <InputAdornment position="start">{entityTemplate.displayName} -</InputAdornment>,
                                }}
                            />
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
                                InputLabelProps={{ sx: { fontSize: '14px', fontWeight: 400 } }}
                                InputProps={{ sx: { fontSize: '14px', fontWeight: 400 } }}
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
                            <Grid item>
                                <FormControlLabel
                                    control={
                                        <MeltaCheckbox
                                            checked={childTemplateFilterByCurrentUser}
                                            onChange={(e) => setChildTemplateFilterByCurrentUser(e.target.checked)}
                                        />
                                    }
                                    label={i18next.t('createChildTemplateDialog.userType.regularUser')}
                                    componentsProps={{
                                        typography: { sx: { fontSize: '14px' } },
                                    }}
                                />
                            </Grid>
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
                                            InputLabelProps={{ sx: { fontSize: '14px', fontWeight: 400 } }}
                                        />
                                    )}
                                    renderOption={(props, category) => (
                                        <li {...props} key={category._id}>
                                            <ColoredEnumChip
                                                label={category.displayName}
                                                color="default"
                                                style={{ backgroundColor: '#EBEFFA', borderRadius: '10px' }}
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
                                                        backgroundColor: '#EBEFFA',
                                                    }}
                                                />
                                            );
                                        })
                                    }
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={5.5}>
                            <TextField
                                label={i18next.t('createChildTemplateDialog.userType.relatedToLabel')}
                                fullWidth
                                rows={1}
                                dir="rtl"
                                variant="outlined"
                                value="a"
                                disabled
                                InputLabelProps={{ sx: { fontSize: '14px', fontWeight: 400 } }}
                                InputProps={{ sx: { fontSize: '14px', fontWeight: 400 } }}
                            />
                        </Grid>
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
                                <Grid item xs={3}>
                                    <Typography sx={{ fontWeight: 400, fontSize: '14px', textAlign: 'center' }}>
                                        {i18next.t('createChildTemplateDialog.columns.filterByUserCol')}
                                    </Typography>
                                </Grid>
                            </Grid>

                            <Grid item xs={12} sx={{ maxHeight: 400, overflowY: 'auto', pr: 3 }}>
                                <FieldsAndFiltersTable
                                    entityTemplate={entityTemplate}
                                    templateFieldsFilters={templateFieldsFilters}
                                    setTemplateFieldsFilters={setTemplateFieldsFilters}
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
        </Dialog>
    );
};

export { CreateChildTemplateDialog };
