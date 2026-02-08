import { AddRounded } from '@mui/icons-material';
import { Button, Divider, FormControlLabel, Grid, Typography } from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import { ByCurrentDefaultValue, ChipType, IChildTemplateForm, IChildTemplateProperty, ViewType } from '../../../interfaces/childTemplates';
import { IUserField } from '../../../interfaces/entities';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IGetUnits, IMongoUnit } from '../../../interfaces/units';
import { IAGGridTextFilter } from '../../../utils/agGrid/interfaces';
import { ColoredEnumChip } from '../../ColoredEnumChip';
import { getFilterFieldReadonly } from '../../inputs/FilterInputs/ReadonlyFilterInput';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';
import { IAGGridFilter } from '../../wizards/entityTemplate/commonInterfaces';
import AddFilterFieldDialog, { IDefaultValue } from './AddFieldFilterDialog';

type IChip = IAGGridFilter | IChildTemplateProperty['defaultValue'];

const getFormattedDefaultValue = (value: IChildTemplateProperty['defaultValue'], fieldSchema: IEntitySingleProperty): string => {
    if (value === null || value === undefined) return '';

    if (Array.isArray(value)) {
        return value
            .map((item) => {
                if (typeof item === 'string') return item;
                if (typeof item === 'object') return (item as IUserField).fullName;
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

            default:
                return value;
        }
    }

    if (typeof value === 'object') {
        if (fieldSchema.format === 'user') {
            const user = value as unknown as IUserField;
            return `${user.fullName} - ${user.hierarchy}`;
        }
        return JSON.stringify(value);
    }

    return String(value);
};

const renderChips = (
    mode: ChipType,
    chips: IAGGridFilter[] | IChildTemplateProperty['defaultValue'][],
    fieldSchema: IEntitySingleProperty,
    onDelete: (chip: IChip, mode: ChipType) => void,
    units: IMongoUnit[],
    isFilterByUser?: boolean,
    isFilterByUserUnit?: boolean,
): React.ReactNode[] => {
    if (isFilterByUser || isFilterByUserUnit) {
        return [
            <Typography sx={{ fontSize: '14px', fontWeight: 400, color: '#BBBED8' }} key={mode}>
                {i18next.t(`childTemplate.${isFilterByUser ? 'byUser' : 'byUnit'}`)}
            </Typography>,
        ];
    }

    return chips.map((chip, index) => {
        let renderedChip = chip;

        if (fieldSchema.format === 'unitField') {
            if (mode === ChipType.Filter) {
                const unitName = units.find((unit) => unit._id === (chip as IAGGridTextFilter).filter)?.name;
                if (unitName) renderedChip = { ...chip, filter: unitName } as IAGGridFilter;
            } else {
                const unitName = units.find((unit) => unit._id === (chip as string))?.name;
                if (unitName) renderedChip = unitName;
            }
        }

        const label =
            mode === ChipType.Filter ? getFilterFieldReadonly(renderedChip, fieldSchema.type) : getFormattedDefaultValue(renderedChip, fieldSchema);

        return (
            // biome-ignore lint/suspicious/noArrayIndexKey: <index is needed here>
            <Grid key={`${renderedChip}-${mode}-${index}`} justifyItems="center">
                <ColoredEnumChip label={label} onDelete={() => onDelete(chip, mode)} enumColor="default" />
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

    const queryClient = useQueryClient();
    const units = queryClient.getQueryData<IGetUnits>('getUnits')!;

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
                        if (isRequired && mode === ChipType.Default) onCheckboxChange(true);

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
                            <Grid container size={{ xs: 12 }} alignItems="center" justifyContent="space-between" sx={{ py: 0.4, ml: 1 }}>
                                <Grid size={{ xs: 3 }}>
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
                                        slotProps={{ typography: { sx: { fontWeight: 400, fontSize: '14px' } } }}
                                    />
                                </Grid>

                                <Grid size={{ xs: 3 }}>
                                    <Grid container spacing={0.5} alignItems="center" justifyContent="center">
                                        {renderChips(
                                            ChipType.Filter,
                                            value.filters ?? [],
                                            property,
                                            onDeleteFilterChip,
                                            units,
                                            isFilterByUser,
                                            isFilterByUserUnit,
                                        )}

                                        <Grid>
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

                                <Grid size={{ xs: 3 }}>
                                    <Grid container spacing={0.5} alignItems="center" justifyContent="center">
                                        {renderChips(
                                            ChipType.Default,
                                            value.defaultValue ? [value.defaultValue] : [],
                                            property,
                                            onDeleteFilterChip,
                                            units,
                                            isFilterByUser,
                                            isFilterByUserUnit,
                                        )}

                                        <Grid>
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
                                    <Grid size={{ xs: 3 }} sx={{ textAlign: 'center' }}>
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
                            <Grid size={{ xs: 12 }}>
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
                    onSubmit={(fieldValue: IAGGridFilter | IDefaultValue) => {
                        const value = values.properties.properties[addFilterField.fieldName];
                        setFieldValue(`properties.properties.${addFilterField.fieldName}`, {
                            ...value,
                            [addFilterField.dialogType]:
                                addFilterField.dialogType === ChipType.Default ? fieldValue : [...(value?.filters ?? []), fieldValue],
                        });
                        setAddFilterField(undefined);
                    }}
                />
            )}
        </>
    );
};

export default FieldsAndFiltersTable;
