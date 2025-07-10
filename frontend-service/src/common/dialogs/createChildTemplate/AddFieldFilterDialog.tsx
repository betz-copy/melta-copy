import React, { useState, useEffect } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Box, Button, Grid, IconButton, Typography, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import i18next from 'i18next';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { SelectFilterInput } from '../../inputs/FilterInputs/SelectFilterInput';
import { DateFilterInput } from '../../inputs/FilterInputs/DateFilterInput';
import { MultipleSelectFilterInput } from '../../inputs/FilterInputs/MultipleSelectFilterInput';
import { MultipleUserFilterInput } from '../../inputs/FilterInputs/MultipleUserFilterInput';
import { TextFilterInput } from '../../inputs/FilterInputs/TextFilterInput';
import { IAGGidNumberFilter, IAGGridDateFilter, IAGGridSetFilter, IAGGridTextFilter } from '../../../utils/agGrid/interfaces';
import { IFieldFilter } from '../../../interfaces/entityChildTemplates';
import { IUser } from '../../../interfaces/users';
import { format } from 'date-fns';
import { ajvValidate } from '../../inputs/JSONSchemaFormik';
import { isValidAGGridFilter } from '../../FilterComponent';
interface IAddFieldFilterDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (fieldName: string, fieldValue: any) => void;
    fieldFilter: IFieldFilter;
    updateFieldFilter: (filterField: IAGGridTextFilter | IAGGidNumberFilter | IAGGridDateFilter | IAGGridSetFilter, currentFieldName: string) => void;
    entityTemplate: IMongoEntityTemplatePopulated;
    currentFieldName: string;
    dialogType: 'filter' | 'default' | 'editByUser';
}

const AddFieldFilterDialog: React.FC<IAddFieldFilterDialogProps> = ({
    open,
    onClose,
    onSubmit,
    entityTemplate,
    fieldFilter,
    updateFieldFilter,
    currentFieldName,
    dialogType,
}) => {
    const readOnly = false;
    const entityFilter = false;

    const [inputValue, setInputValue] = useState<string>('');
    const [localFilterField, setLocalFilterField] = useState<IFieldFilter['filterField']>(fieldFilter.filterField || undefined);
    const [currentFieldError, setCurrentFieldError] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (open) {
            setLocalFilterField(fieldFilter.filterField || undefined);
        }
    }, [open, fieldFilter]);

    const handleFilterFieldChange = (value: IFieldFilter['filterField']) => {
        setCurrentFieldError(undefined);
        setLocalFilterField(value);
    };

    const handleDateChange = (newValue: Date | null, isStartDate: boolean) => {
        setCurrentFieldError(undefined);

        const fieldSchema = entityTemplate.properties.properties[currentFieldName];

        const dateFormat = fieldSchema.format === 'date-time' ? 'yyyy-MM-dd HH:mm:ss' : 'yyyy-MM-dd';

        const stringDate = newValue ? format(newValue, dateFormat) : null;

        setLocalFilterField({
            ...localFilterField,
            ...(isStartDate ? { dateFrom: stringDate } : { dateTo: stringDate }),
        } as IAGGridDateFilter);
    };

    const handleCheckboxChange = (option: string | IUser, checked: boolean) => {
        setCurrentFieldError(undefined);
        const { values = [] } = (localFilterField || {}) as IAGGridSetFilter;
        const updatedValues = checked ? [...values, option] : values.filter((item) => item !== option);
        setLocalFilterField({ ...localFilterField, values: updatedValues } as IAGGridSetFilter);
    };

    const handleFilterTypeChange = (newTypeFilter: IAGGridDateFilter['type'] | IAGGridTextFilter['type'] | IAGGidNumberFilter['type']) => {
        setCurrentFieldError(undefined);
        setLocalFilterField({ ...localFilterField, type: newTypeFilter } as any);
    };

    const renderFilterInput = () => {
        const property = entityTemplate.properties.properties[currentFieldName];
        if (!property) return null;
        const { format, enum: propEnum, type, items } = property;

        const defaultFilterProps =
            dialogType === 'default'
                ? {
                      hideFilterType: true,
                      forceEqualsType: true,
                  }
                : {};

        if (propEnum) {
            return (
                <SelectFilterInput
                    filterField={localFilterField?.filterType === 'text' ? (localFilterField as IAGGridTextFilter) : undefined}
                    enumOptions={propEnum}
                    handleFilterFieldChange={(value) => value && handleFilterFieldChange(value)}
                    readOnly={readOnly}
                    {...defaultFilterProps}
                />
            );
        }

        if (format === 'date-time' || format === 'date') {
            return (
                <DateFilterInput
                    filterField={localFilterField?.filterType === 'date' ? (localFilterField as IAGGridDateFilter) : undefined}
                    handleFilterTypeChange={handleFilterTypeChange}
                    handleDateChange={handleDateChange}
                    readOnly={readOnly}
                    entityFilter={entityFilter}
                    {...defaultFilterProps}
                />
            );
        }

        if (type === 'boolean') {
            return (
                <SelectFilterInput
                    filterField={localFilterField?.filterType === 'text' ? (localFilterField as IAGGridTextFilter) : undefined}
                    isBooleanSelect
                    handleFilterFieldChange={(value) => value && handleFilterFieldChange(value)}
                    readOnly={readOnly}
                    {...defaultFilterProps}
                />
            );
        }

        if (items?.enum) {
            return (
                <MultipleSelectFilterInput
                    filterField={localFilterField?.filterType === 'set' ? (localFilterField as IAGGridSetFilter) : undefined}
                    handleCheckboxChange={handleCheckboxChange}
                    enumOptions={items.enum}
                    readOnly={readOnly}
                    {...defaultFilterProps}
                />
            );
        }

        if (items?.format === 'user' && type === 'array') {
            return (
                <MultipleUserFilterInput
                    filterField={localFilterField?.filterType === 'set' ? (localFilterField as IAGGridSetFilter) : undefined}
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    handleCheckboxChange={handleCheckboxChange}
                    readOnly={readOnly}
                    isUsersArray
                    {...defaultFilterProps}
                />
            );
        }

        return (
            <TextFilterInput
                entityFilter={entityFilter}
                filterField={
                    localFilterField?.filterType === 'number' || localFilterField?.filterType === 'text'
                        ? (localFilterField as IAGGidNumberFilter | IAGGridTextFilter)
                        : undefined
                }
                handleFilterFieldChange={handleFilterFieldChange}
                handleFilterTypeChange={handleFilterTypeChange}
                type={type}
                readOnly={readOnly}
                {...defaultFilterProps}
                error={!!currentFieldError}
                helperText={currentFieldError}
            />
        );
    };

    const handleSubmit = () => {
        if (!localFilterField) return;

        if (dialogType === 'default') {
            let defaultValue: string | number | boolean | Date | string[] | (string | IUser | null)[] | null | undefined;
            const fieldSchema = entityTemplate.properties.properties[currentFieldName];

            if (localFilterField.filterType === 'text' || localFilterField.filterType === 'number') {
                defaultValue = localFilterField.filter;
            } else if (localFilterField.filterType === 'set') {
                defaultValue = localFilterField.values;
            } else if (localFilterField.filterType === 'date') {
                defaultValue = localFilterField.dateFrom;
            }

            const templateSchema = {
                ...entityTemplate.properties,
                required: [],
                properties: {
                    [currentFieldName]: fieldSchema,
                },
            };

            const formData = { [currentFieldName]: defaultValue };

            const ajvErrors = ajvValidate(templateSchema, formData);

            if (ajvErrors && ajvErrors[currentFieldName]) setCurrentFieldError(ajvErrors[currentFieldName] as string);
            else onSubmit(currentFieldName, defaultValue);
        } else {
            updateFieldFilter(localFilterField, currentFieldName);
            onSubmit(currentFieldName, localFilterField);
        }
    };

    const isValueValid = () => {
        if (localFilterField === undefined) return false;
        if (dialogType !== 'editByUser') return isValidAGGridFilter(localFilterField);
        return true;
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography>
                        {dialogType === 'filter'
                            ? i18next.t('createChildTemplateDialog.fieldFilterDialog.title')
                            : i18next.t('createChildTemplateDialog.fieldDefaultDialog.title')}
                    </Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            disabled
                            value={entityTemplate.properties.properties[currentFieldName]?.title || currentFieldName}
                            InputLabelProps={{ shrink: false }}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        {renderFilterInput()}
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} display="flex" justifyContent="center">
                        <Button variant="contained" color="primary" onClick={handleSubmit} disabled={!isValueValid()}>
                            {i18next.t('createChildTemplateDialog.fieldFilterDialog.addFilter')}
                        </Button>
                    </Grid>
                </Grid>
            </DialogActions>
        </Dialog>
    );
};

export default AddFieldFilterDialog;
