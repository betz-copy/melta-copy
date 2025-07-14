import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, TextField, Typography } from '@mui/material';
import { format } from 'date-fns';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { ChipType, IFieldChip, IFieldFilter } from '../../../interfaces/childTemplates';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IUser } from '../../../interfaces/users';
import { IAGGidNumberFilter, IAGGridDateFilter, IAGGridSetFilter, IAGGridTextFilter } from '../../../utils/agGrid/interfaces';
import { DateFilterInput } from '../../inputs/FilterInputs/DateFilterInput';
import { MultipleSelectFilterInput } from '../../inputs/FilterInputs/MultipleSelectFilterInput';
import { MultipleUserFilterInput } from '../../inputs/FilterInputs/MultipleUserFilterInput';
import { SelectFilterInput } from '../../inputs/FilterInputs/SelectFilterInput';
import { TextFilterInput } from '../../inputs/FilterInputs/TextFilterInput';

import { matchValueAgainstFilter } from '../../../utils/filters';
import { isValidAGGridFilter } from '../../FilterComponent';
import { ajvValidate } from '../../inputs/JSONSchemaFormik';

const getFilterOperator = (filterField: IFieldChip['filterField']) => {
    const operatorMap: Record<string, string> = {
        equals: '$eq',
        notEqual: '$ne',
        greaterThan: '$gt',
        greaterThanOrEqual: '$gte',
        lessThan: '$lt',
        lessThanOrEqual: '$lte',
        inRange: '$in',
        not: '$not',
        // contains: '$rgx', // contains always true in the validation
        notContains: '$notContains',
    };

    switch (filterField?.filterType) {
        case 'text':
        case 'number':
        case 'date':
            return operatorMap[filterField.type];
        case 'set':
            return filterField.values && filterField.values.length > 0 ? '$in' : null;
        default:
            console.warn('Unsupported filter type:', filterField);
            return null;
    }
};

const getFilterValue = (filterField: IFieldChip['filterField']) => {
    switch (filterField?.filterType) {
        case 'text':
        case 'number':
            return filterField.filter;
        case 'date':
            return filterField.dateFrom;
        case 'set':
            return filterField.values;
        default:
            console.warn('Unsupported filter type:', filterField);
            return null;
    }
};

interface IAddFieldFilterDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (fieldName: string, fieldValue: any) => void;
    fieldFilter: IFieldFilter;
    updateFieldFilter: (filterField: IAGGridTextFilter | IAGGidNumberFilter | IAGGridDateFilter | IAGGridSetFilter, currentFieldName: string) => void;
    entityTemplate: IMongoEntityTemplatePopulated;
    currentFieldName: string;
    dialogType: ChipType;
    fieldChips: IFieldChip[];
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
    fieldChips,
}) => {
    const readOnly = false;
    const entityFilter = false;

    const [inputValue, setInputValue] = useState<string>('');
    const [localFilterField, setLocalFilterField] = useState<IFieldFilter['filterField']>(fieldFilter.filterField || undefined);
    const [currentFieldError, setCurrentFieldError] = useState<string | undefined>(undefined);
    const [matchValidationError, setMatchValidationError] = useState<string | null>(null);

    const isError = !!currentFieldError;

    const handleClose = () => {
        setMatchValidationError(null);
        onClose();
    };

    const checkMatchValidation = (filterField: IFieldChip['filterField'], fieldName: string, value: any) => {
        const data = { [fieldName]: value };

        const operator = getFilterOperator(filterField);

        if (operator) {
            const filter = {
                [fieldName]: {
                    [operator]: getFilterValue(filterField),
                },
            };

            return matchValueAgainstFilter(data, filter);
        }
        return true;
    };

    const onFailedMatch = () => {
        setMatchValidationError(
            i18next.t('validation.matchFilter', {
                dialogType: i18next.t(`createChildTemplateDialog.dialogType.${dialogType}`),
            }),
        );
    };

    const checkMatchValidations = (value: any): boolean => {
        const fieldName = entityTemplate.properties.properties[currentFieldName]?.title || currentFieldName;

        const filtersChip = fieldChips.filter((chip) => chip.chipType === ChipType.Filter && chip.fieldName === currentFieldName);

        if (dialogType === ChipType.Default && filtersChip.length > 0) {
            const anyValid = filtersChip.some(({ filterField }) => checkMatchValidation(filterField, fieldName, value.filter));

            if (!anyValid) {
                onFailedMatch();
                return false;
            }
        }

        if (dialogType === ChipType.Filter) {
            const defaultChip = fieldChips.find((chip) => chip.chipType === ChipType.Default && chip.fieldName === currentFieldName);

            if (defaultChip) {
                const anyValid = [{ filterField: value }, ...filtersChip].some(({ filterField }) => {
                    return checkMatchValidation(filterField, fieldName, defaultChip.defaultValue);
                });

                if (!anyValid) {
                    onFailedMatch();
                    return false;
                }
            }
        }

        setMatchValidationError(null);
        return true;
    };

    useEffect(() => {
        if (open) {
            setLocalFilterField(fieldFilter.filterField || undefined);
        }
    }, [open, fieldFilter]);

    const handleFilterFieldChange = (value: IFieldFilter['filterField']) => {
        setCurrentFieldError(undefined);
        checkMatchValidations(value);
        setLocalFilterField(value);
    };

    const handleDateChange = (newValue: Date | null, isStartDate: boolean) => {
        setCurrentFieldError(undefined);

        const fieldSchema = entityTemplate.properties.properties[currentFieldName];

        const dateFormat = fieldSchema.format === 'date-time' ? 'yyyy-MM-dd HH:mm:ss' : 'yyyy-MM-dd';

        const dateString = newValue ? format(newValue, dateFormat) : null;

        checkMatchValidations(newValue);

        setLocalFilterField({
            ...localFilterField,
            ...(isStartDate ? { dateFrom: dateString } : { dateTo: dateString }),
        } as IAGGridDateFilter);
    };

    const handleCheckboxChange = (option: string | IUser, checked: boolean) => {
        setCurrentFieldError(undefined);
        const { values = [] } = (localFilterField || {}) as IAGGridSetFilter;
        checkMatchValidations(values);
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
            dialogType === ChipType.Default
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
                    error={isError}
                    helperText={currentFieldError}
                    {...defaultFilterProps}
                />
            );
        }

        if (format === 'date-time' || format === 'date') {
            return (
                <DateFilterInput
                    filterField={localFilterField?.filterType === 'date' ? localFilterField : undefined}
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
                    filterField={localFilterField?.filterType === 'text' ? localFilterField : undefined}
                    isBooleanSelect
                    handleFilterFieldChange={(value) => value && handleFilterFieldChange(value)}
                    readOnly={readOnly}
                    error={isError}
                    helperText={currentFieldError}
                    {...defaultFilterProps}
                />
            );
        }

        if (items?.enum) {
            return (
                <MultipleSelectFilterInput
                    filterField={localFilterField?.filterType === 'set' ? localFilterField : undefined}
                    handleCheckboxChange={handleCheckboxChange}
                    enumOptions={items.enum}
                    readOnly={readOnly}
                    isError={isError}
                    helperText={currentFieldError}
                    {...defaultFilterProps}
                />
            );
        }

        if (items?.format === 'user' && type === 'array') {
            return (
                <MultipleUserFilterInput
                    filterField={localFilterField?.filterType === 'set' ? localFilterField : undefined}
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    handleCheckboxChange={handleCheckboxChange}
                    readOnly={readOnly}
                    isUsersArray
                    isError={isError}
                    helperText={currentFieldError}
                    {...defaultFilterProps}
                />
            );
        }

        return (
            <TextFilterInput
                entityFilter={entityFilter}
                filterField={localFilterField?.filterType === 'number' || localFilterField?.filterType === 'text' ? localFilterField : undefined}
                handleFilterFieldChange={handleFilterFieldChange}
                handleFilterTypeChange={handleFilterTypeChange}
                type={type}
                readOnly={readOnly}
                error={isError}
                helperText={currentFieldError}
                {...defaultFilterProps}
            />
        );
    };

    const handleSubmit = () => {
        if (!localFilterField) return;
        setMatchValidationError(null);

        if (dialogType === ChipType.Default) {
            const fieldSchema = entityTemplate.properties.properties[currentFieldName];
            let defaultValue: string | number | boolean | Date | string[] | (string | IUser | null)[] | null | undefined;

            if (localFilterField.filterType === 'text' || localFilterField.filterType === 'number') defaultValue = localFilterField.filter;
            else if (localFilterField.filterType === 'set') defaultValue = localFilterField.values;
            else if (localFilterField.filterType === 'date') defaultValue = localFilterField.dateFrom;

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
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography>
                        {i18next.t(`createChildTemplateDialog.field${dialogType.charAt(0).toUpperCase()}${dialogType.slice(1)}Dialog.title`)}
                    </Typography>
                    <IconButton onClick={handleClose}>
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
                        {matchValidationError && (
                            <Typography variant="body2" color="error" align="left" style={{ marginTop: '8px' }}>
                                {matchValidationError}
                            </Typography>
                        )}
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} display="flex" justifyContent="center">
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit}
                            disabled={!isValueValid() || isError || !!matchValidationError}
                        >
                            {i18next.t('createChildTemplateDialog.fieldFilterDialog.addFilter')}
                        </Button>
                    </Grid>
                </Grid>
            </DialogActions>
        </Dialog>
    );
};

export default AddFieldFilterDialog;
