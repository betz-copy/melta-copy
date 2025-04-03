/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState } from 'react';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Button,
    Grid,
    FormControlLabel,
    Checkbox,
    Typography,
    FormControl,
    RadioGroup,
    Radio,
    Autocomplete,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { AddRounded } from '@mui/icons-material';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { ICategoryMap, IMongoCategory } from '../../../interfaces/categories';
import { ColoredEnumChip } from '../../ColoredEnumChip';
import AddFieldFilterDialog from './AddFieldFilterDialog';

interface IFieldFilter {
    fieldValue: IEntitySingleProperty;
    selected: boolean;
    filterValue?: any;
}

const CreateChildTemplateDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    entityTemplate: IMongoEntityTemplatePopulated | null;
}> = ({ open, handleClose, entityTemplate }) => {
    if (!entityTemplate) return null;

    const queryClient = useQueryClient();

    const [selectedCategories, setSelectedCategories] = useState<IMongoCategory[]>(entityTemplate!.category ? [entityTemplate!.category] : []);
    const [fieldFilters, setFieldFilters] = useState<Record<string, IFieldFilter>>(
        Object.entries(entityTemplate.properties.properties).reduce((acc, [fieldName, fieldValue]) => {
            // eslint-disable-next-line no-param-reassign
            acc[fieldName] = { fieldValue, selected: false };
            return acc;
        }, {} as Record<string, IFieldFilter>),
    );
    const [isRegularStatus, setIsRegularStatus] = useState(true);
    const [isSpecialStatus, setIsSpecialStatus] = useState(false);
    const [isRegularUser, setIsRegularUser] = useState(true);
    const [isSpecialUser, setIsSpecialUser] = useState(false);
    console.log(isSpecialStatus);

    const [addFilterToField, setAddFilterToField] = useState<string | null>(null);

    const handleSave = () => {
        handleClose();
    };
    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;

    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>{entityTemplate?.displayName}</DialogTitle>
                <DialogContent>
                    <Grid container direction="column">
                        <Grid container sx={{ pt: 1 }} alignItems="center" justifyContent="space-between">
                            <Grid xs={6} item>
                                <TextField fullWidth label={i18next.t('createChildTemplateDialog.templateName')} />
                            </Grid>
                            <Grid xs={5.5} item>
                                <TextField
                                    label={i18next.t('createChildTemplateDialog.templateDetails')}
                                    multiline
                                    fullWidth
                                    rows={1}
                                    dir="rtl"
                                    variant="outlined"
                                />
                            </Grid>
                        </Grid>

                        <Grid container direction="row">
                            <Grid xs={6} item container marginBottom="0.4rem">
                                <FormControl>
                                    <RadioGroup
                                        value={isRegularStatus ? 'regular' : 'special'}
                                        onChange={(e) => {
                                            const { value } = e.target;
                                            setIsRegularStatus(value === 'regular');
                                            setIsSpecialStatus(value === 'special');
                                        }}
                                        row
                                    >
                                        <FormControlLabel
                                            value="regular"
                                            control={<Radio />}
                                            label={i18next.t('createChildTemplateDialog.status.regularPage')}
                                        />
                                        <FormControlLabel
                                            value="special"
                                            control={<Radio />}
                                            label={i18next.t('createChildTemplateDialog.status.specialPage')}
                                        />
                                    </RadioGroup>
                                </FormControl>
                            </Grid>
                            <Grid xs={6} item container>
                                <Grid item>
                                    <FormControlLabel
                                        control={<Checkbox checked={isRegularUser} onChange={(e) => setIsRegularUser(e.target.checked)} />}
                                        label={i18next.t('createChildTemplateDialog.userType.regularUser')}
                                    />
                                </Grid>
                                <Grid item>
                                    <FormControlLabel
                                        control={<Checkbox checked={isSpecialUser} onChange={(e) => setIsSpecialUser(e.target.checked)} />}
                                        label={i18next.t('createChildTemplateDialog.userType.specialUser')}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>

                        <Grid container sx={{ pt: 1 }} alignItems="center" justifyContent="space-between">
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
                                                <ColoredEnumChip label={category.displayName} color="default" />
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
                                                        deleteIcon={<CloseIcon />}
                                                        {...restTagProps}
                                                        style={{
                                                            margin: '0 4px 4px 0',
                                                            borderRadius: '4px',
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
                                />
                            </Grid>
                        </Grid>

                        <Grid container sx={{ pt: 4 }} alignItems="start" justifyContent="space-between">
                            <Grid item xs={12}>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    {i18next.t('createChildTemplateDialog.columns.title')}
                                </Typography>
                                <Grid container>
                                    <Grid container justifyContent="space-between">
                                        <Grid container item xs={6} sx={{ mb: 2 }}>
                                            <Grid item xs={3}>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {i18next.t('createChildTemplateDialog.columns.nameCol')}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={3}>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {i18next.t('createChildTemplateDialog.columns.filterCol')}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Typography variant="body2" fontWeight="bold">
                                                {i18next.t('createChildTemplateDialog.columns.defaultCol')}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Grid>
                                <Grid container>
                                    {Object.entries(fieldFilters).map(([fieldName, fieldFilter]) => (
                                        <Grid container justifyContent="space-between" key={fieldName}>
                                            <Grid container item xs={6} spacing={2}>
                                                <Grid item xs={3}>
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={fieldFilter.selected}
                                                                onChange={(e) => {
                                                                    const newFieldFilters = { ...fieldFilters };
                                                                    newFieldFilters[fieldName].selected = e.target.checked;
                                                                    setFieldFilters(newFieldFilters);
                                                                }}
                                                            />
                                                        }
                                                        label={fieldName}
                                                    />
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <Button
                                                        variant="outlined"
                                                        color="primary"
                                                        onClick={() => {
                                                            setAddFilterToField(fieldName);
                                                        }}
                                                        sx={{ width: '100%' }}
                                                    >
                                                        <AddRounded />
                                                    </Button>
                                                </Grid>
                                            </Grid>
                                            <Grid item xs={3}>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {i18next.t('createChildTemplateDialog.columns.defaultCol')}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>{i18next.t('actions.cancel')}</Button>
                    <Button onClick={handleSave} variant="contained" color="primary">
                        {i18next.t('actions.create')}
                    </Button>
                </DialogActions>
            </Dialog>
            {!!addFilterToField && (
                <AddFieldFilterDialog
                    open={!!addFilterToField}
                    onClose={() => {
                        setAddFilterToField(null);
                    }}
                    fieldFilters={fieldFilters}
                    setFieldFilters={setFieldFilters}
                    entityTemplate={entityTemplate}
                    currentFieldName={addFilterToField}
                />
            )}
        </>
    );
};

export { CreateChildTemplateDialog };
