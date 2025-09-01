import { AddRounded } from '@mui/icons-material';
import { Button, Divider, FormControlLabel, Grid, Typography } from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React, { useState } from 'react';
import { ByCurrentDefaultValue, ChipType, IChildTemplateForm, IChildTemplateProperty, ViewType } from '../../../interfaces/childTemplates';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IUser } from '../../../interfaces/users';
import { ColoredEnumChip } from '../../ColoredEnumChip';
import { getFilterFieldReadonly } from '../../inputs/FilterInputs/ReadonlyFilterInput';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';
import { IAGGridFilter } from '../../wizards/entityTemplate/commonInterfaces';
import AddFilterFieldDialog from './AddFieldFilterDialog';

type IChip = IAGGridFilter | IChildTemplateProperty['defaultValue'];

const getFormattedDefaultValue = (value: IChildTemplateProperty['defaultValue'], fieldSchema: IEntitySingleProperty): string => {
    if (value === null || value === undefined) return '';

    if (Array.isArray(value)) {
        return value
            .map((item) => {
                if (typeof item === 'string') return item;
                if (typeof item === 'object') return (item as IUser).fullName;
                return String(item);
            })
            .join(', ');
    }
    if (typeof value === 'boolean') return i18next.t(`booleanOptions.${value ? 'yes' : 'no'}`);

    if (typeof value === 'string') {
        switch (fieldSchema.format) {
            case 'date-time':
            case 'date':
                return value === ByCurrentDefaultValue.byCurrentDate
                    ? i18next.t('childTemplate.currentDate')
                    : new Date(value).toLocaleDateString('he-IL');

            case 'user':
                if (value === ByCurrentDefaultValue.byCurrentUser) return i18next.t('childTemplate.byUser');

                const userObj = JSON.parse(value);
                if (userObj.fullName && userObj.hierarchy) {
                    return `${userObj.fullName} - ${userObj.hierarchy}`;
                }

                return value;
            default:
                return value;
        }
    }

    return String(value);
};

const renderChips = (
    mode: ChipType,
    chips: IAGGridFilter[] | IChildTemplateProperty['defaultValue'][],
    fieldSchema: IEntitySingleProperty,
    onDelete: (chip: IChip, mode: ChipType) => void,
    isFilterByUser?: boolean,
    isFilterByUserUnit?: boolean,
): React.ReactNode[] => {
    if (isFilterByUser || isFilterByUserUnit) {
        return [
            <Typography sx={{ fontSize: '14px', fontWeight: 400, color: '#BBBED8' }}>
                {i18next.t(`childTemplate.${isFilterByUser ? 'byUser' : 'byUnit'}`)}
            </Typography>,
        ];
    }

    return chips.map((chip, index) => {
        const label = mode === ChipType.Filter ? getFilterFieldReadonly(chip, fieldSchema.type) : getFormattedDefaultValue(chip, fieldSchema);

        return (
            <Grid item key={`${chip}-${mode}-${index}`} justifyItems="center">
                <ColoredEnumChip label={label} onDelete={() => onDelete(chip, mode)} color="default" />
            </Grid>
        );
    });
};

interface IFieldsAndFiltersTableProps {
    formikProps: FormikProps<IChildTemplateForm>;
    entityTemplate: IMongoEntityTemplatePopulated;
}

const FieldsAndFiltersTable: React.FC<IFieldsAndFiltersTableProps> = ({ formikProps, entityTemplate }) => {
    const { values, setFieldValue, setFieldTouched } = formikProps;

    const [addFilterField, setAddFilterField] = useState<{ dialogType: ChipType; fieldName: string } | undefined>(undefined);

    return (
        <>
            <Grid container>
                {Object.entries(entityTemplate.properties.properties).map(([fieldName, property]) => {
                    const value = values.properties.properties[fieldName] ?? {};

                    const isRequired = entityTemplate.properties.required.includes(fieldName);

                    const isSerialNumberField = !!property?.serialCurrent;
                    const isRelationshipRefField = property?.format === 'relationshipReference';
                    const isFilterByUser = property?.format === 'user' && values.filterByCurrentUserField === fieldName;
                    const isFilterByUserUnit = property?.format === 'unitField' && values.filterByUnitUserField === fieldName;

                    const onCheckboxChange = (checked: boolean) => {
                        setFieldTouched(`properties.properties.${fieldName}`, true);
                        setFieldValue(`properties.properties.${fieldName}`, {
                            ...value,
                            display: checked,
                            isEditableByUser: !checked ? false : value.isEditableByUser,
                        });
                    };

                    const onDeleteFilterChip = (chip: IChip, mode: ChipType) => {
                        if (isRequired && mode == ChipType.Default) onCheckboxChange(true);

                        setFieldTouched(`properties.properties.${fieldName}`, true);
                        const prev = values.properties.properties[fieldName];
                        setFieldValue(`properties.properties.${fieldName}`, {
                            ...prev,
                            [mode]: mode === ChipType.Default ? undefined : (prev[mode] as IAGGridFilter[] | undefined)?.filter((c) => c !== chip),
                        });
                    };

                    const isDisallowedFormat = () => {
                        const prop = entityTemplate.properties.properties[fieldName];
                        const disabledFormats = ['fileId', 'signature', 'location', 'comment', 'kartoffelUserField'];
                        const disabledArrayFormats = ['fileId', 'user'];
                        return (
                            disabledFormats.includes(prop.format ?? '') || !!(prop.items && disabledArrayFormats.includes(prop.items.format ?? ''))
                        );
                    };

                    const isSubmitDisabled = () => {
                        const byCurrentUserDefaultValue = property.format === 'user' && value.defaultValue === ByCurrentDefaultValue.byCurrentUser;
                        const byCurrentDateDefaultValue =
                            (property.format === 'date' || property.format === 'date-time') &&
                            value.defaultValue === ByCurrentDefaultValue.byCurrentDate;

                        return isDisallowedFormat() || byCurrentUserDefaultValue || byCurrentDateDefaultValue;
                    };

                    const handleSelectProperty = (dialogType: ChipType) => setAddFilterField({ dialogType, fieldName });

                    return (
                        <React.Fragment key={fieldName}>
                            <Grid container alignItems="center" justifyContent="space-between" sx={{ py: 0.4, ml: 1 }}>
                                <Grid item xs={3}>
                                    <FormControlLabel
                                        control={
                                            <MeltaCheckbox
                                                checked={value.display}
                                                disabled={isRequired && value.defaultValue === undefined}
                                                onChange={(e) => onCheckboxChange(e.target.checked)}
                                            />
                                        }
                                        label={
                                            <>
                                                {property.title || fieldName}
                                                {isRequired && <span> * </span>}
                                            </>
                                        }
                                        componentsProps={{ typography: { sx: { fontWeight: 400, fontSize: '14px' } } }}
                                    />
                                </Grid>

                                <Grid item xs={3}>
                                    <Grid container spacing={0.5} alignItems="center" justifyContent="center">
                                        {renderChips(
                                            ChipType.Filter,
                                            value.filters ?? [],
                                            property,
                                            onDeleteFilterChip,
                                            isFilterByUser,
                                            isFilterByUserUnit,
                                        )}

                                        <Grid item>
                                            {!isFilterByUser && !isFilterByUserUnit && (
                                                <Button
                                                    color="primary"
                                                    onClick={() => !isSubmitDisabled() && handleSelectProperty(ChipType.Filter)}
                                                    size="small"
                                                    sx={{ minWidth: '32px', p: '4px' }}
                                                    disabled={isSubmitDisabled()}
                                                >
                                                    <AddRounded />
                                                </Button>
                                            )}
                                        </Grid>
                                    </Grid>
                                </Grid>

                                <Grid item xs={3}>
                                    <Grid container spacing={0.5} alignItems="center" justifyContent="center">
                                        {renderChips(
                                            ChipType.Default,
                                            value.defaultValue ? [value.defaultValue] : [],
                                            property,
                                            onDeleteFilterChip,
                                            isFilterByUser,
                                            isFilterByUserUnit,
                                        )}

                                        <Grid item>
                                            {!isFilterByUser && !isFilterByUserUnit && (
                                                <Button
                                                    color="primary"
                                                    onClick={() => handleSelectProperty(ChipType.Default)}
                                                    size="small"
                                                    sx={{ minWidth: '32px', p: '4px' }}
                                                    disabled={isSerialNumberField || isDisallowedFormat() || isRelationshipRefField}
                                                >
                                                    <AddRounded />
                                                </Button>
                                            )}
                                        </Grid>
                                    </Grid>
                                </Grid>

                                {values.viewType === ViewType.userPage && (
                                    <Grid item xs={3} sx={{ textAlign: 'center' }}>
                                        <MeltaCheckbox
                                            checked={value.isEditableByUser || false}
                                            disabled={!value.display}
                                            onChange={(e) => {
                                                setFieldValue(`properties.properties.${fieldName}`, {
                                                    ...value,
                                                    isEditableByUser: e.target.checked,
                                                });
                                            }}
                                        />
                                    </Grid>
                                )}
                            </Grid>
                            <Grid item xs={12}>
                                <Divider />
                            </Grid>
                        </React.Fragment>
                    );
                })}
            </Grid>

            {addFilterField && (
                <AddFilterFieldDialog
                    addFilterField={addFilterField}
                    formikProps={formikProps}
                    entityTemplate={entityTemplate}
                    onClose={() => setAddFilterField(undefined)}
                    onSubmit={(fieldValue: any) => {
                        const value = values.properties.properties[addFilterField.fieldName];
                        setFieldValue(`properties.properties.${addFilterField.fieldName}`, {
                            ...value,
                            [addFilterField.dialogType]:
                                addFilterField.dialogType === ChipType.Default ? fieldValue : [...((value && value.filters) ?? []), fieldValue],
                        });
                        setAddFilterField(undefined);
                    }}
                />
            )}
        </>
    );
};

export default FieldsAndFiltersTable;
