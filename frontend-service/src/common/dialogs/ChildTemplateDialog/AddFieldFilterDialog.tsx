import { Close } from '@mui/icons-material';
import { Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, TextField, Typography } from '@mui/material';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { IAgGridDateFilter, IAgGridNumberFilter, IAgGridSetFilter, IAgGridTextFilter } from '@packages/rule-breach';
import { IGetUnits } from '@packages/unit';
import { IUser } from '@packages/user';
import { format } from 'date-fns';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import { isEqual } from 'lodash';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import { environment } from '../../../globals';
import { ChipType, IChildTemplateForm, IFilterDateType } from '../../../interfaces/childTemplateForms';
import { IGraphFilterBody } from '../../../interfaces/graphFilter';
import { initializedFilterField, isValidAGGridFilter } from '../../FilterComponent';
import { DateFilterInput } from '../../inputs/FilterInputs/DateFilterInput';
import { MultipleSelectFilterInput } from '../../inputs/FilterInputs/MultipleSelectFilterInput';
import { MultipleUserFilterInput } from '../../inputs/FilterInputs/MultipleUserFilterInput';
import { SelectFilterInput } from '../../inputs/FilterInputs/SelectFilterInput';
import { TextFilterInput } from '../../inputs/FilterInputs/TextFilterInput';
import { UserFilterInput } from '../../inputs/FilterInputs/UserFilterInput';
import { ajvValidate } from '../../inputs/JSONSchemaFormik';
import { IAgGridFilter } from '../../wizards/entityTemplate/commonInterfaces';

const { loggingDate, loggingDateTime } = environment.formats;

export type IDefaultValue = string | number | boolean | string[] | Date | (string | IUser | null)[] | null | undefined;

interface IAddFilterFieldDialogProps {
    addFilterField: { dialogType: ChipType; fieldName: string };
    formikProps: FormikProps<IChildTemplateForm>;
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated;
    onClose: () => void;
    onSubmit: (fieldValue: IAgGridFilter | IDefaultValue) => void;
}

const AddFilterFieldDialog: React.FC<IAddFilterFieldDialogProps> = ({
    addFilterField,
    formikProps: { setFieldTouched },
    entityTemplate,
    onClose,
    onSubmit,
}) => {
    const { dialogType, fieldName } = addFilterField;

    const property = entityTemplate.properties.properties[fieldName];
    const initializedFilter =
        (property.enum && initializedFilterField.array) ||
        (property.format && initializedFilterField[property.format]) ||
        (property.type && initializedFilterField[property.type]);

    const [inputValue, setInputValue] = useState<string>('');
    const [localFilterField, setLocalFilterField] = useState<IAgGridFilter | undefined>(initializedFilter);
    const [currentFieldError, setCurrentFieldError] = useState<string | undefined>(undefined);

    const queryClient = useQueryClient();
    const units = queryClient.getQueryData<IGetUnits>('getUnits')!;

    const readOnly = false;
    const entityFilter = false;
    const isError = !!currentFieldError;

    const handleClose = () => {
        onClose();
    };

    const handleFilterTypeChange = (newTypeFilter: IAgGridDateFilter['type'] | IAgGridTextFilter['type'] | IAgGridNumberFilter['type']) => {
        setCurrentFieldError(undefined);
        setLocalFilterField({ ...localFilterField, type: newTypeFilter } as IAgGridFilter);
    };

    const handleFilterFieldChange = (value: IGraphFilterBody['filterField']) => {
        setCurrentFieldError(undefined);
        setLocalFilterField(value);
    };

    const handleDateChange = (newValue: IFilterDateType, isStartDate: boolean) => {
        setCurrentFieldError(undefined);

        const fieldSchema = entityTemplate.properties.properties[fieldName];

        const dateFormat = fieldSchema.format === 'date-time' ? loggingDateTime : loggingDate;

        const dateString = newValue ? (typeof newValue === 'string' ? newValue : format(newValue, dateFormat)) : null;

        setLocalFilterField({
            ...localFilterField,
            ...(isStartDate ? { dateFrom: dateString } : { dateTo: dateString }),
        } as IAgGridDateFilter);
    };

    const handleCheckboxChange = (options: (string | IUser | null)[], checked: boolean) => {
        setCurrentFieldError(undefined);

        const { values = [] } = (localFilterField || {}) as IAgGridSetFilter;

        let updatedValues: (string | null | IUser)[];

        if (checked) updatedValues = Array.from(new Set([...values, ...options]));
        else updatedValues = values.filter((value) => !options.some((option) => isEqual(option, value)));

        setLocalFilterField({ ...localFilterField, values: updatedValues } as IAgGridSetFilter);
    };

    const handleSubmit = () => {
        setFieldTouched(`properties.properties${fieldName}`, true);

        if (!localFilterField) return;

        if (dialogType !== ChipType.Default) {
            onSubmit(localFilterField);
            return;
        }

        let defaultValue: IDefaultValue;

        if (localFilterField.filterType === 'text' || localFilterField.filterType === 'number') defaultValue = localFilterField.filter;
        else if (localFilterField.filterType === 'set') defaultValue = localFilterField.values;
        else if (localFilterField.filterType === 'date') defaultValue = localFilterField.dateFrom;

        const templateSchema = {
            ...entityTemplate.properties,
            required: [],
            properties: {
                [fieldName]: entityTemplate.properties.properties[fieldName],
            },
        };

        const formData = { [fieldName]: defaultValue };

        const ajvErrors = ajvValidate(templateSchema, formData);

        if (ajvErrors?.[fieldName]) setCurrentFieldError(ajvErrors[fieldName] as string);
        else onSubmit(defaultValue);
    };

    const isValueValid = () => {
        if (localFilterField === undefined) return false;
        if (dialogType !== ChipType.EditByUser) return isValidAGGridFilter(localFilterField);
        return true;
    };

    const renderFilterInput = () => {
        if (!property) return null;
        const { format, enum: propEnum, type, items } = property;

        const defaultFilterProps =
            dialogType === ChipType.Default
                ? {
                      hideFilterType: true,
                      forceEqualsType: true,
                  }
                : {};

        const enumOptions = propEnum ?? items?.enum;
        const singleEnumOptions = enumOptions?.map((option) => ({ option, label: option }));

        if (enumOptions) {
            const isDefault = dialogType === ChipType.Default;

            if (isDefault && propEnum)
                return (
                    <SelectFilterInput
                        filterField={localFilterField?.filterType === 'text' ? localFilterField : undefined}
                        enumOptions={singleEnumOptions}
                        handleFilterFieldChange={(value) => value && handleFilterFieldChange(value)}
                        readOnly={readOnly}
                        error={isError}
                        helperText={currentFieldError}
                        {...defaultFilterProps}
                    />
                );

            return (
                <MultipleSelectFilterInput
                    filterField={localFilterField?.filterType === 'set' ? localFilterField : undefined}
                    handleCheckboxChange={handleCheckboxChange}
                    enumOptions={enumOptions.map((option) => ({ option, label: option }))}
                    readOnly={readOnly}
                    isError={isError}
                    helperText={currentFieldError}
                    allowEmpty={!isDefault}
                    {...defaultFilterProps}
                />
            );
        }

        if (format === 'user' && dialogType === ChipType.Default)
            return (
                <UserFilterInput
                    filterField={localFilterField?.filterType === 'text' ? localFilterField : undefined}
                    handleFilterFieldChange={handleFilterFieldChange}
                    handleFilterTypeChange={handleFilterTypeChange}
                    {...defaultFilterProps}
                />
            );

        if (format === 'date-time' || format === 'date') {
            return (
                <DateFilterInput
                    filterField={localFilterField?.filterType === 'date' ? localFilterField : undefined}
                    handleFilterTypeChange={handleFilterTypeChange}
                    handleDateChange={handleDateChange}
                    currentDateCheckbox={dialogType === ChipType.Default}
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

        if (items?.format === 'user' && type === 'array') {
            return (
                <MultipleUserFilterInput
                    filterField={localFilterField?.filterType === 'set' ? localFilterField : undefined}
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    handleCheckboxChange={handleCheckboxChange}
                    readOnly={readOnly}
                    isError={isError}
                    helperText={currentFieldError}
                    {...defaultFilterProps}
                />
            );
        }

        if (format === 'unitField') {
            const { filter } = (localFilterField ?? {}) as IAgGridTextFilter;

            return (
                <Autocomplete
                    options={units.filter((unit) => unit._id !== filter)}
                    onChange={(_e, value) => handleFilterFieldChange({ ...localFilterField, filter: value?._id } as IAgGridTextFilter)}
                    value={units.find((unit) => unit._id === filter)}
                    getOptionLabel={(option) => option.name}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            error={isError}
                            helperText={currentFieldError}
                            variant="outlined"
                            label={i18next.t('childTemplate.selectUnitDialog.label')}
                        />
                    )}
                    disabled={readOnly}
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

    return (
        <Dialog open={!!addEventListener} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography>{i18next.t(`childTemplate.field${dialogType.charAt(0).toUpperCase()}${dialogType.slice(1)}Dialog.title`)}</Typography>
                    <IconButton onClick={handleClose}>
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <TextField fullWidth disabled value={property?.title || fieldName} slotProps={{ inputLabel: { shrink: false } }} />
                    </Grid>

                    <Grid size={{ xs: 12 }}>{renderFilterInput()}</Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12 }} display="flex" justifyContent="center">
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit}
                            sx={{ borderRadius: '7px', padding: '6.99px 30px', fontWeight: 400 }}
                            disabled={!isValueValid() || isError}
                        >
                            {i18next.t('childTemplate.addAction')}
                        </Button>
                    </Grid>
                </Grid>
            </DialogActions>
        </Dialog>
    );
};

export default AddFilterFieldDialog;
