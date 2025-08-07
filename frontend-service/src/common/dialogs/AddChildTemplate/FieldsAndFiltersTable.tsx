import { AddRounded } from '@mui/icons-material';
import { Button, Divider, FormControlLabel, Grid, Typography } from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React from 'react';
import { ChipType, IChildTemplatePopulatedFromDb, IFieldChip, ViewType } from '../../../interfaces/childTemplates';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { ColoredEnumChip } from '../../ColoredEnumChip';
import { formatToString } from '../../EntityProperties';
import { getFilterFieldReadonly } from '../../inputs/FilterInputs/ReadonlyFilterInput';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';

const renderChips = (
    chips: IFieldChip[],
    fieldSchema: IEntitySingleProperty,
    onDelete: (chip: IFieldChip) => void,
    matchErrorMap?: Map<string, string>,
): React.ReactNode[] => {
    return chips.map((chip, index) => {
        const label =
            chip.chipType === ChipType.Filter
                ? getFilterFieldReadonly(chip.filterField!, fieldSchema.type)
                : formatToString(chip.defaultValue, fieldSchema);

        const matchError = matchErrorMap?.get(chip.fieldName);

        return (
            <Grid item key={`${chip.fieldName}-${chip.chipType}-${index}`} justifyItems="center">
                <ColoredEnumChip label={label} onDelete={() => onDelete(chip)} color="default" />
                {matchError && (
                    <Typography variant="body2" color="error" align="left" style={{ marginTop: '8px' }}>
                        {matchError}
                    </Typography>
                )}
            </Grid>
        );
    });
};

interface IFieldsAndFiltersTableProps {
    formikProps: FormikProps<IChildTemplatePopulatedFromDb>;
    entityTemplate: IMongoEntityTemplatePopulated;
}

const FieldsAndFiltersTable: React.FC<IFieldsAndFiltersTableProps> = ({ formikProps, entityTemplate }) => {
    const { values, setFieldValue } = formikProps;

    // const onDeleteFilterChip = (chip: IFieldChip) => {
    //     const updatedFilters = (values.properties.properties[chip.fieldName].filters ?? { $or: [] }).$or.filter((c) => c !== chip);
    //     setFieldValue(`properties.properties.${chip.fieldName}.filters`, { $or: updatedFilters });
    // };

    return (
        <Grid container>
            <Grid item xs={12}>
                <Divider />
            </Grid>

            {Object.entries(values.properties.properties).map(([fieldName, fieldFilter]) => {
                const isRequired = entityTemplate.properties.required.includes(fieldName);
                const property = entityTemplate.properties.properties[fieldName];

                const isKartoffelUserField = property?.format === 'kartoffelUserField';
                const isSerialNumberField = !!property?.serialCurrent;
                const isRelationshipRefField = property?.format === 'relationshipReference';

                // const filterChips = fieldChips.filter((c) => c.fieldName === fieldName && c.chipType === ChipType.Filter);
                // const defaultChips = fieldChips.filter((c) => c.fieldName === fieldName && c.chipType === ChipType.Default);

                return (
                    <React.Fragment key={fieldName}>
                        <Grid container alignItems="center" justifyContent="space-between" sx={{ py: 0.4, ml: 1 }}>
                            <Grid item xs={3}>
                                <FormControlLabel
                                    control={
                                        <MeltaCheckbox
                                            checked={fieldFilter.display}
                                            disabled={isRequired && fieldFilter.defaultValue === undefined}
                                            onChange={(e) => {
                                                const prev = values.properties.properties[fieldName];
                                                setFieldValue(`properties.properties.${fieldName}`, { ...prev, display: e.target.checked });
                                            }}
                                        />
                                    }
                                    label={
                                        <>
                                            {entityTemplate.properties.properties[fieldName].title}
                                            {isRequired && <span>*</span>}
                                        </>
                                    }
                                    componentsProps={{ typography: { sx: { fontWeight: 400, fontSize: '14px' } } }}
                                />
                            </Grid>

                            <Grid item xs={3}>
                                <Grid container spacing={0.5} alignItems="center" justifyContent="center">
                                    {/* {renderChips(values.properties.properties[fieldName]?.filters?.$or?.map((filterChip) => ), property, onDeleteFilterChip)} */}

                                    <Grid item>
                                        {property?.format === 'user' && values.filterByCurrentUserField === fieldName ? (
                                            <Typography sx={{ fontSize: '14px', fontWeight: 400, color: '#BBBED8' }}>
                                                {i18next.t('childTemplate.byUser')}
                                            </Typography>
                                        ) : (
                                            <Button
                                                color="primary"
                                                onClick={() =>
                                                    !isSubmitDisabled(fieldName, property) && handleSelectProperty(fieldName, ChipType.Filter)
                                                }
                                                size="small"
                                                sx={{ minWidth: '32px', p: '4px' }}
                                                disabled={isSubmitDisabled(fieldName, property)}
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
                                        defaultChips,
                                        entityTemplate.properties.properties[fieldName],
                                        (chip) => {
                                            if (isRequired) onCheckboxChange(fieldName, true);
                                            setFieldChips((prev) =>
                                                prev.filter((c) => !(c.fieldName === chip.fieldName && c.chipType === chip.chipType)),
                                            );
                                            setTemplateFieldsFilters((prev) => ({
                                                ...prev,
                                                [chip.fieldName]: {
                                                    ...prev[chip.fieldName],
                                                    defaultValue: undefined,
                                                },
                                            }));
                                        },
                                        matchValidationError,
                                    )}
                                    {!defaultChips.length && (
                                        <Grid item>
                                            {property?.format === 'user' && selectedUserField === fieldName ? (
                                                <Typography sx={{ fontSize: '14px', fontWeight: 400, color: '#BBBED8' }}>
                                                    {i18next.t('childTemplate.byUser')}
                                                </Typography>
                                            ) : (
                                                <Button
                                                    color="primary"
                                                    onClick={() => handleSelectProperty(fieldName, ChipType.Default)}
                                                    size="small"
                                                    sx={{ minWidth: '32px', p: '4px' }}
                                                    disabled={
                                                        isSerialNumberField ||
                                                        isDisallowedFormat(fieldName) ||
                                                        isKartoffelUserField ||
                                                        isRelationshipRefField
                                                    }
                                                >
                                                    <AddRounded />
                                                </Button>
                                            )}
                                        </Grid>
                                    )}
                                </Grid>
                            </Grid>

                            {values.viewType === ViewType.userPage && (
                                <Grid item xs={3} sx={{ textAlign: 'center' }}>
                                    <MeltaCheckbox
                                        checked={values.properties.properties[fieldName]?.isEditableByUser || false}
                                        disabled={!fieldFilter.display}
                                        onChange={(e) => setFieldValue(`properties.properties.${fieldName}.isEditableByUser`, e.target.checked)}
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
    );
};

export default FieldsAndFiltersTable;
