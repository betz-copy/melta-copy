import { Button, Divider, FormControlLabel, Grid, Typography } from '@mui/material';
import React from 'react';
import { AddRounded } from '@mui/icons-material';
import i18next from 'i18next';
import AddFieldFilterDialog from './AddFieldFilterDialog';
import { IExtendedUserFieldType, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IAGGridTextFilter, IAGGidNumberFilter, IAGGridDateFilter, IAGGridSetFilter } from '../../../utils/agGrid/interfaces';
import { MeltaCheckbox } from '../../MeltaCheckbox';
import { ColoredEnumChip } from '../../ColoredEnumChip';
import { IFieldChip, IFieldFilter, ITemplateFieldsFilters } from './interfaces';

interface IFieldsAndFiltersTableProps {
    entityTemplate: IMongoEntityTemplatePopulated;
    templateFieldsFilters: ITemplateFieldsFilters;
    setTemplateFieldsFilters: React.Dispatch<React.SetStateAction<ITemplateFieldsFilters>>;
    viewType: 'categoryPage' | 'userPage';
    fieldChips: IFieldChip[];
    setFieldChips: React.Dispatch<React.SetStateAction<IFieldChip[]>>;
}

const FieldsAndFiltersTable: React.FC<IFieldsAndFiltersTableProps> = ({
    entityTemplate,
    templateFieldsFilters,
    setTemplateFieldsFilters,
    viewType,
    fieldChips,
    setFieldChips,
}) => {
    const [addFilterToField, setAddFilterToField] = React.useState<string | null>(null);
    const [dialogType, setDialogType] = React.useState<'filter' | 'default' | 'editByUser' | null>(null);

    const addFilterToFieldHandler = (
        filterField: IAGGridTextFilter | IAGGidNumberFilter | IAGGridDateFilter | IAGGridSetFilter,
        currentFieldName: string,
    ) => {
        const newFieldFilter = {
            ...templateFieldsFilters[currentFieldName],
        };
        newFieldFilter.filterField = filterField;
        setTemplateFieldsFilters((prev) => ({
            ...prev,
            [currentFieldName]: newFieldFilter,
        }));
    };

    const handleSelectProperty = (newProperty: string | null, type: 'filter' | 'default' | 'editByUser') => {
        setAddFilterToField(newProperty);
        setDialogType(type);

        if (!newProperty) return;
        if (!entityTemplate) return;

        const { format, type: fieldType } = entityTemplate.properties.properties[newProperty];

        const initializedFilterField: Record<string, IFieldFilter['filterField']> = {
            'date-time': { filterType: 'date', type: 'equals', dateFrom: null, dateTo: null },
            date: { filterType: 'date', type: 'equals', dateFrom: null, dateTo: null },
            number: { filterType: 'number', type: 'equals' },
            string: { filterType: 'text', type: 'contains' },
            boolean: { filterType: 'text', type: 'equals' },
            array: { filterType: 'set', values: [] },
        };

        const selectedFilter = (format && initializedFilterField[format]) || (fieldType && initializedFilterField[fieldType]);

        if (selectedFilter) addFilterToFieldHandler(selectedFilter, newProperty);
    };

    const isDisallowedFormat = (fieldName: string): boolean => {
        const prop = entityTemplate.properties.properties[fieldName];
        return (
            prop.format === 'fileId' ||
            prop.format === 'signature' ||
            prop.format === 'location' ||
            prop.format === 'comment' ||
            prop.items?.format === 'fileId'
        );
    };

    return (
        <>
            <Grid container>
                <Grid item xs={12}>
                    <Divider />
                </Grid>
                <Grid container>
                    {Object.entries(templateFieldsFilters).map(([fieldName, fieldFilter]) => {
                        const isRequired = entityTemplate.properties.required.includes(fieldName);

                        return (
                            <React.Fragment key={fieldName}>
                                <Grid container alignItems="center" justifyContent="space-between" sx={{ py: 1.5, ml: 1 }}>
                                    <Grid item xs={3}>
                                        <FormControlLabel
                                            control={
                                                <MeltaCheckbox
                                                    checked={isRequired ? true : fieldFilter.selected}
                                                    disabled={isRequired}
                                                    onChange={(e) => {
                                                        if (isRequired) return;
                                                        const newFieldFilters = { ...templateFieldsFilters };
                                                        newFieldFilters[fieldName].selected = e.target.checked;
                                                        setTemplateFieldsFilters(newFieldFilters);
                                                    }}
                                                />
                                            }
                                            label={
                                                <>
                                                    {fieldFilter.fieldValue.title || fieldName}
                                                    {isRequired && <span style={{ marginRight: '3px' }}>*</span>}
                                                </>
                                            }
                                            componentsProps={{
                                                typography: { sx: { fontWeight: 400, fontSize: '14px' } },
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={3}>
                                        <Grid container spacing={0.5} alignItems="center" justifyContent="center">
                                            {fieldChips
                                                .filter((chip) => chip.fieldName === fieldName && chip.chipType === 'filter')
                                                .map((chip, index) => {
                                                    const filterTypeLabel = 'type' in chip.filterType! ? chip.filterType.type : '';
                                                    const filterValue =
                                                        'filter' in chip.filterType!
                                                            ? chip.filterType.filter
                                                            : 'values' in chip.filterType!
                                                            ? chip.filterType.values.join(', ')
                                                            : 'dateFrom' in chip.filterType!
                                                            ? chip.filterType.dateFrom?.toString()
                                                            : '';
                                                    return (
                                                        <Grid item key={`${fieldName}-filter-${index}`}>
                                                            <ColoredEnumChip
                                                                label={`${i18next.t(`filters.${filterTypeLabel}`)} : ${filterValue}`}
                                                                onDelete={() => {
                                                                    setFieldChips((prev) =>
                                                                        prev.filter(
                                                                            (c) =>
                                                                                !(
                                                                                    c.fieldName === chip.fieldName &&
                                                                                    c.chipType === 'filter' &&
                                                                                    c.value === chip.value
                                                                                ),
                                                                        ),
                                                                    );
                                                                }}
                                                                color="default"
                                                            />
                                                        </Grid>
                                                    );
                                                })}

                                            <Grid item>
                                                {entityTemplate.properties.properties[fieldName]?.format === 'user' ? (
                                                    <Typography sx={{ fontSize: '14px', fontWeight: 400, color: '#BBBED8' }}>
                                                        {i18next.t('createChildTemplateDialog.byUser')}
                                                    </Typography>
                                                ) : entityTemplate.properties.properties[fieldName]?.format ===
                                                  IExtendedUserFieldType.unitUserField ? (
                                                    <Typography sx={{ fontSize: '14px', fontWeight: 400, color: '#BBBED8' }}>
                                                        {i18next.t('createChildTemplateDialog.byUnit')}
                                                    </Typography>
                                                ) : (
                                                    <Button
                                                        color="primary"
                                                        onClick={() => {
                                                            if (!fieldFilter.selected || isDisallowedFormat(fieldName)) return;
                                                            handleSelectProperty(fieldName, 'filter');
                                                        }}
                                                        size="small"
                                                        sx={{ minWidth: '32px', p: '4px' }}
                                                        disabled={!fieldFilter.selected || isDisallowedFormat(fieldName)}
                                                    >
                                                        <AddRounded />
                                                    </Button>
                                                )}
                                            </Grid>
                                        </Grid>
                                    </Grid>

                                    <Grid item xs={3}>
                                        <Grid container spacing={0.5} alignItems="center" justifyContent="center">
                                            {fieldChips
                                                .filter((chip) => chip.fieldName === fieldName && chip.chipType === 'default')
                                                .map((chip) => {
                                                    const filterValue =
                                                        chip.value === null || chip.value === undefined
                                                            ? ''
                                                            : Array.isArray(chip.value)
                                                            ? chip.value.join(', ')
                                                            : String(chip.value);

                                                    return (
                                                        <Grid item key={`${fieldName}-default`}>
                                                            <ColoredEnumChip
                                                                label={`${filterValue}`}
                                                                onDelete={() => {
                                                                    setFieldChips((prev) =>
                                                                        prev.filter(
                                                                            (c) => !(c.fieldName === chip.fieldName && c.chipType === 'default'),
                                                                        ),
                                                                    );
                                                                }}
                                                                color="default"
                                                            />
                                                        </Grid>
                                                    );
                                                })}

                                            {!fieldChips.some((chip) => chip.fieldName === fieldName && chip.chipType === 'default') && (
                                                <Grid item>
                                                    {entityTemplate.properties.properties[fieldName]?.format === 'user' ? (
                                                        <Typography sx={{ fontSize: '14px', fontWeight: 400, color: '#BBBED8' }}>
                                                            {i18next.t('createChildTemplateDialog.byUser')}
                                                        </Typography>
                                                    ) : entityTemplate.properties.properties[fieldName]?.format ===
                                                      IExtendedUserFieldType.unitUserField ? (
                                                        <Typography sx={{ fontSize: '14px', fontWeight: 400, color: '#BBBED8' }}>
                                                            {i18next.t('createChildTemplateDialog.byUnit')}
                                                        </Typography>
                                                    ) : (
                                                        <Button
                                                            color="primary"
                                                            onClick={() => {
                                                                if (!fieldFilter.selected || isDisallowedFormat(fieldName)) return;
                                                                handleSelectProperty(fieldName, 'default');
                                                            }}
                                                            size="small"
                                                            sx={{ minWidth: '32px', p: '4px' }}
                                                            disabled={!fieldFilter.selected || isDisallowedFormat(fieldName)}
                                                        >
                                                            <AddRounded />
                                                        </Button>
                                                    )}
                                                </Grid>
                                            )}
                                        </Grid>
                                    </Grid>

                                    {viewType === 'userPage' && (
                                        <Grid item xs={3} sx={{ textAlign: 'center' }}>
                                            <MeltaCheckbox />
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
            </Grid>

            {addFilterToField && (
                <AddFieldFilterDialog
                    open={!!addFilterToField}
                    onClose={() => {
                        setAddFilterToField(null);
                    }}
                    onSubmit={(fieldName, fieldValue) => {
                        if (dialogType === 'filter') {
                            if (!fieldValue || typeof fieldValue !== 'object') return;

                            setFieldChips((prev) => {
                                const newChip = {
                                    fieldName,
                                    chipType: 'filter' as const,
                                    filterType: structuredClone(fieldValue),
                                    value:
                                        'filter' in fieldValue
                                            ? fieldValue.filter
                                            : 'values' in fieldValue
                                            ? fieldValue.values
                                            : 'dateFrom' in fieldValue
                                            ? fieldValue.dateFrom
                                            : '',
                                };

                                return [...prev, newChip];
                            });
                        } else if (dialogType === 'default') {
                            const value = typeof fieldValue === 'object' && 'value' in fieldValue ? fieldValue.value : fieldValue;

                            setTemplateFieldsFilters((prev) => ({
                                ...prev,
                                [fieldName]: {
                                    ...prev[fieldName],
                                    defaultValue: value,
                                },
                            }));

                            setFieldChips((prev) => [
                                ...prev,
                                {
                                    fieldName,
                                    chipType: 'default' as const,
                                    value,
                                },
                            ]);
                        }

                        setAddFilterToField(null);
                    }}
                    updateFieldFilter={addFilterToFieldHandler}
                    entityTemplate={entityTemplate}
                    currentFieldName={addFilterToField}
                    fieldFilter={templateFieldsFilters[addFilterToField]}
                    dialogType={dialogType!}
                />
            )}
        </>
    );
};
export default FieldsAndFiltersTable;
