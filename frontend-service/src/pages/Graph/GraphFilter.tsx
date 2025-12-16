import {
    ByCurrentDefaultValue,
    filterTypes,
    IAgGridDateFilter,
    IAgGridNumberFilter,
    IAgGridSetFilter,
    IAgGridTextFilter,
    IEntityTemplateMap,
    IGetUnits,
    IGraphFilterBody,
    IMongoEntityTemplateWithConstraintsPopulated,
    IUser,
    numberFilterOperationTypes,
    relativeDateFilters,
} from '@microservices/shared';
import { Clear, Close, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { Autocomplete, Box, Divider, Grid, IconButton, TextField, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import { isEqual } from 'lodash';
import debounce from 'lodash/debounce';
import React, { useCallback, useState } from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { useQueryClient } from 'react-query';
import { CustomIcon } from '../../common/CustomIcon';
import { initializedFilterField } from '../../common/FilterComponent';
import { DateFilterInput } from '../../common/inputs/FilterInputs/DateFilterInput';
import { MultipleSelectFilterInput } from '../../common/inputs/FilterInputs/MultipleSelectFilterInput';
import { MultipleUserFilterInput } from '../../common/inputs/FilterInputs/MultipleUserFilterInput';
import { ReadOnlyFilterInput } from '../../common/inputs/FilterInputs/ReadonlyFilterInput';
import { SelectFilterInput } from '../../common/inputs/FilterInputs/SelectFilterInput';
import { StyledFilterInput } from '../../common/inputs/FilterInputs/StyledFilterInput';
import { TextFilterInput } from '../../common/inputs/FilterInputs/TextFilterInput';
import { useDarkModeStore } from '../../stores/darkMode';

type IFilterDateType = Date | ByCurrentDefaultValue.byCurrentDate | relativeDateFilters | null;

interface GraphFilterProps {
    templateOptions: IMongoEntityTemplateWithConstraintsPopulated[];
    graphEntityTemplateIds: string[];
    deleteFilter: (value: number) => void;
    setFilterRecord: (value: IGraphFilterBody, filterKey: number) => void;
    filterKey: number;
    removeFilterFromFilterList: (filterKey: number) => void;
    entityFilter: boolean;
    filter?: IGraphFilterBody;
    onFilter?: () => void;
    selectedEntityTemplate?: IMongoEntityTemplateWithConstraintsPopulated | null;
    readOnly?: boolean;
}

const GraphFilter: React.FC<GraphFilterProps> = ({
    filterKey,
    templateOptions,
    deleteFilter,
    setFilterRecord,
    filter,
    graphEntityTemplateIds,
    removeFilterFromFilterList,
    entityFilter,
    onFilter,
    selectedEntityTemplate,
    readOnly = false,
}) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const units = queryClient.getQueryData<IGetUnits>('getUnits')!;

    const darkMode = useDarkModeStore((state) => state.darkMode);
    const theme = useTheme();
    const [selectedTemplate, setSelectedTemplate] = useState<IMongoEntityTemplateWithConstraintsPopulated | null>(
        filter?.selectedTemplate ? (entityTemplates.get(filter.selectedTemplate._id) ?? null) : (selectedEntityTemplate ?? null),
    );
    const [selectedProperty, setSelectedProperty] = useState<string | null>(filter?.selectedProperty ?? null);
    const [filterField, setFilterField] = useState<IGraphFilterBody['filterField']>(filter?.filterField || undefined);
    const [fullView, setFullView] = useState<boolean>(true);
    const [inputValue, setInputValue] = useState<string>('');

    const options = templateOptions.filter((option) => graphEntityTemplateIds.includes(option._id));
    const properties = selectedTemplate?.properties.properties;
    const notIncludedFormats = ['fileId', 'signature', 'location', 'comment'];
    const filterProperties = properties
        ? Object.keys(properties).filter(
              (prop) => !notIncludedFormats.includes(properties[prop].format ?? '') && properties[prop].items?.format !== 'fileId',
          )
        : [];

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedOnFilter = useCallback(
        debounce((newFilterField: IGraphFilterBody['filterField'], template, property) => {
            const newValue: IGraphFilterBody = {
                selectedTemplate: template,
                selectedProperty: property,
                filterField: newFilterField,
            };

            setFilterRecord(newValue, filterKey);
            onFilter?.();
        }, 500),
        [filterKey],
    );

    const handleSelectTemplate = (newValue: IMongoEntityTemplateWithConstraintsPopulated | null) => {
        setSelectedTemplate(newValue);
        setSelectedProperty(null);
        setFilterField(undefined);

        if (!newValue && selectedProperty) removeFilterFromFilterList(filterKey);
    };

    const handleSelectProperty = (newProperty: string | null) => {
        setSelectedProperty(newProperty);

        if (!newProperty) {
            if (filterField) removeFilterFromFilterList(filterKey);
            return;
        }

        if (!selectedTemplate) return;

        const { format, type, enum: enumValues } = selectedTemplate.properties.properties[newProperty];

        const selectedFilter =
            (enumValues && initializedFilterField['array']) || (format && initializedFilterField[format]) || (type && initializedFilterField[type]);

        if (selectedFilter) setFilterField(selectedFilter);
    };

    const handleSetFilterRecord = (newFilterField: IGraphFilterBody['filterField'], condition: boolean = true) => {
        if (condition) debouncedOnFilter(newFilterField, selectedTemplate, selectedProperty);
    };

    const handleFilterFieldChange = (value: IGraphFilterBody['filterField'], condition: boolean = true) => {
        setFilterField(value);

        if (
            (value?.filterType === filterTypes.number || value?.filterType === filterTypes.text) &&
            (value.filter === undefined || value.filter === '')
        ) {
            removeFilterFromFilterList(filterKey);
            return;
        }

        handleSetFilterRecord(value, condition);
    };

    const handleDateChange = (newValue: IFilterDateType, isStartDate: boolean) => {
        if (!newValue && filterField?.filterType === filterTypes.date) {
            const isRemovingStart = isStartDate && !filterField.dateTo;
            const isRemovingEnd = !isStartDate && !filterField.dateFrom;
            if (isRemovingStart || isRemovingEnd) {
                removeFilterFromFilterList(filterKey);
                return;
            }
        }

        handleFilterFieldChange(
            {
                ...filterField,
                ...(isStartDate ? { dateFrom: newValue } : { dateTo: newValue }),
            } as IAgGridDateFilter,
            Boolean(
                isStartDate
                    ? filterField?.filterType === filterTypes.date &&
                          newValue &&
                          (filterField.type !== numberFilterOperationTypes.inRange || filterField.dateTo)
                    : newValue &&
                          filterField?.filterType === filterTypes.date &&
                          filterField.type === numberFilterOperationTypes.inRange &&
                          filterField.dateFrom,
            ),
        );
    };

    const handleCheckboxChange = (options: (string | IUser | null)[], checked: boolean) => {
        const { values } = filterField as IAgGridSetFilter;

        let updatedValues: (string | null | IUser)[];

        if (checked) updatedValues = Array.from(new Set([...values, ...options]));
        else updatedValues = values.filter((value) => !options.some((option) => isEqual(option, value)));
        const updatedFilterField = { ...filterField, values: updatedValues } as IAgGridSetFilter;

        setFilterField(updatedFilterField);
        if (updatedValues.length === 0) removeFilterFromFilterList(filterKey);
        else handleSetFilterRecord(updatedFilterField);
    };

    const handleFilterTypeChange = (
        newTypeFilter: IAgGridDateFilter['type'] | IAgGridTextFilter['type'] | IAgGridNumberFilter['type'],
        condition: boolean = true,
    ) => {
        if (filterField?.filterType === filterTypes.date) {
            const relativeDateFilterValues = Object.values(relativeDateFilters);
            if (
                relativeDateFilterValues.includes(filterField.type as relativeDateFilters) &&
                !relativeDateFilterValues.includes(newTypeFilter as relativeDateFilters)
            ) {
                setFilterField({ ...filterField, type: newTypeFilter, dateFrom: null, dateTo: null } as IAgGridDateFilter);
                return;
            }
        }

        handleFilterFieldChange({ ...filterField, type: newTypeFilter } as IAgGridDateFilter | IAgGridTextFilter | IAgGridNumberFilter, condition);
    };

    const handleFilterErasion = () => {
        removeFilterFromFilterList(filterKey);
        deleteFilter(filterKey);
    };

    const renderFilterInput = () => {
        if (!(selectedProperty && selectedTemplate)) return null;
        const { format, enum: propEnum, type, items, title } = selectedTemplate.properties.properties[selectedProperty];

        if (readOnly) return <ReadOnlyFilterInput filterField={filterField} selectedProperty={{ title, type }} />;

        // no files in graph filter
        if (items?.format === 'fileId' || format === 'fileId' || format === 'signature') return null;

        const enumOptions = propEnum ?? items?.enum;

        if (enumOptions)
            return (
                <MultipleSelectFilterInput
                    filterField={filterField?.filterType === filterTypes.set ? (filterField as IAgGridSetFilter) : undefined}
                    handleCheckboxChange={handleCheckboxChange}
                    enumOptions={enumOptions.map((option) => ({ option, label: option }))}
                    readOnly={readOnly}
                />
            );

        if (format === 'date-time' || format === 'date')
            return (
                <DateFilterInput
                    filterField={filterField?.filterType === filterTypes.date ? (filterField as IAgGridDateFilter) : undefined}
                    handleFilterTypeChange={handleFilterTypeChange}
                    handleDateChange={handleDateChange}
                    readOnly={readOnly}
                    entityFilter={entityFilter}
                />
            );

        if (type === 'boolean')
            return (
                <SelectFilterInput
                    filterField={filterField?.filterType === filterTypes.text ? (filterField as IAgGridTextFilter) : undefined}
                    isBooleanSelect
                    handleFilterFieldChange={handleFilterFieldChange}
                    readOnly={readOnly}
                />
            );

        if (items?.format === 'user' && type === 'array')
            return (
                <MultipleUserFilterInput
                    filterField={filterField?.filterType === filterTypes.set ? (filterField as IAgGridSetFilter) : undefined}
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    handleCheckboxChange={handleCheckboxChange}
                    readOnly={readOnly}
                />
            );

        if (format === 'unitField') {
            const { filter } = (filterField ?? {}) as IAgGridTextFilter;

            return (
                <Autocomplete
                    options={units.filter((unit) => unit._id !== filter)}
                    onChange={(_e, value) => handleFilterFieldChange({ ...filterField, filter: value?._id } as IAgGridTextFilter)}
                    value={units.find((unit) => unit._id === filter)}
                    getOptionLabel={(option) => option.name}
                    renderInput={(params) => <TextField {...params} variant="outlined" label={i18next.t('childTemplate.selectUnitDialog.label')} />}
                    disabled={readOnly}
                />
            );
        }

        return (
            <TextFilterInput
                entityFilter={entityFilter}
                filterField={
                    filterField?.filterType === filterTypes.number || filterField?.filterType === filterTypes.text
                        ? (filterField as IAgGridNumberFilter | IAgGridTextFilter)
                        : undefined
                }
                handleFilterFieldChange={handleFilterFieldChange}
                handleFilterTypeChange={handleFilterTypeChange}
                type={type}
                readOnly={readOnly}
            />
        );
    };

    let backgroundColor = '#EBEFFA33';
    if (entityFilter && !readOnly) backgroundColor = darkMode ? '#4a4a5033' : '#EBEFFA33';
    else backgroundColor = darkMode ? '#121212' : 'white';

    return (
        <>
            <Grid
                sx={{
                    borderRadius: '10px',
                    ...(!entityFilter && {
                        boxShadow: '0px 2px 1px -1px  #1E27754D',
                        marginBottom: '5px',
                    }),
                    backgroundColor,
                }}
            >
                {!entityFilter && (
                    <Grid sx={{ position: 'relative' }}>
                        <Grid sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '40px' }}>
                            <Typography
                                style={{
                                    fontWeight: '500',
                                    fontFamily: 'Rubik',
                                    fontSize: '14px',
                                    padding: '15px',
                                    marginRight: '7px',
                                    color: theme.palette.primary.main,
                                }}
                                variant="body1"
                            >
                                {i18next.t('graph.filterEntity')}
                            </Typography>
                            <Grid>
                                <IconButton onClick={() => setFullView(!fullView)} sx={{ color: theme.palette.primary.main }}>
                                    {fullView ? <KeyboardArrowDown fontSize="small" /> : <KeyboardArrowUp fontSize="small" />}
                                </IconButton>

                                <IconButton onClick={handleFilterErasion} sx={{ color: theme.palette.primary.main }}>
                                    <Close fontSize="small" />
                                </IconButton>
                            </Grid>
                        </Grid>
                        <Grid display={fullView ? undefined : 'none'}>
                            {!selectedTemplate && (
                                <Autocomplete
                                    popupIcon={<IoIosArrowDown fontSize="small" />}
                                    size="small"
                                    style={{ width: '90%', margin: 'auto', paddingBottom: '10px' }}
                                    value={null}
                                    onChange={(_event, newValue) => handleSelectTemplate(newValue)}
                                    options={options}
                                    getOptionLabel={(option) => option.displayName}
                                    renderInput={(params) => <StyledFilterInput {...params} variant="outlined" sx={{ borderRadius: '5px' }} />}
                                />
                            )}
                            {selectedTemplate && (
                                <Grid container justifyContent="space-around" alignItems="center">
                                    <Grid>
                                        {selectedTemplate.iconFileId && (
                                            <CustomIcon
                                                iconUrl={selectedTemplate.iconFileId}
                                                height="24px"
                                                width="24px"
                                                color={theme.palette.primary.main}
                                            />
                                        )}
                                    </Grid>
                                    <Grid>
                                        <Typography
                                            style={{
                                                fontWeight: '400',
                                                fontSize: '14px',
                                            }}
                                            variant="subtitle1"
                                        >
                                            {selectedTemplate.displayName}
                                        </Typography>
                                    </Grid>
                                    <Grid>
                                        <IconButton onClick={() => handleSelectTemplate(null)}>
                                            <Clear sx={{ fontSize: '1.1rem' }} />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            )}
                        </Grid>
                    </Grid>
                )}
                <Grid display={fullView ? undefined : 'none'}>
                    {selectedTemplate && !readOnly && (
                        <Grid
                            sx={{
                                height: '90px',
                                display: 'flex',
                                flexDirection: entityFilter ? 'row' : 'column',
                                alignItems: 'center',
                            }}
                        >
                            {!entityFilter && <Divider sx={{ width: '90%', margin: 'auto', border: '1px 0px 0px 0px' }} />}
                            {!readOnly && (
                                <Autocomplete
                                    popupIcon={<IoIosArrowDown size="15px" />}
                                    clearIcon={<Close sx={{ fontSize: '16px' }} />}
                                    size="small"
                                    sx={{
                                        width: '90%',
                                        ...(entityFilter ? { marginLeft: '5%' } : { margin: 'auto', paddingBottom: '10px' }),
                                    }}
                                    value={selectedProperty}
                                    onChange={(_event, newValue) => handleSelectProperty(newValue)}
                                    options={filterProperties}
                                    getOptionLabel={(option) =>
                                        selectedTemplate?.properties.properties[option] ? selectedTemplate.properties.properties[option].title : ''
                                    }
                                    renderInput={(params) => (
                                        <StyledFilterInput
                                            {...params}
                                            variant="outlined"
                                            sx={{ borderRadius: '5px' }}
                                            label={entityFilter ? i18next.t('charts.field') : undefined}
                                        />
                                    )}
                                    readOnly={readOnly}
                                    getOptionDisabled={(option) => {
                                        const propertyTemplate = selectedEntityTemplate?.properties.properties[option];
                                        if (propertyTemplate?.format === 'relationshipReference') {
                                            const relatedTemplateId = propertyTemplate.relationshipReference?.relatedTemplateId!;
                                            return !entityTemplates?.get(relatedTemplateId);
                                        }
                                        return false;
                                    }}
                                />
                            )}
                            {entityFilter && !readOnly && (
                                <IconButton onClick={handleFilterErasion}>
                                    <Close fontSize="small" sx={{ color: theme.palette.primary.main }} />
                                </IconButton>
                            )}
                        </Grid>
                    )}

                    {selectedProperty && (
                        <Grid container justifyContent="center">
                            <Grid style={{ width: '90%', paddingBottom: '10px' }}>{renderFilterInput()}</Grid>
                        </Grid>
                    )}
                </Grid>
            </Grid>
            {entityFilter &&
                (readOnly ? <Box sx={{ height: '3px', width: '100%', my: 1 }} /> : <Divider sx={{ width: '100%', my: 1, borderColor: '#EBEFFA' }} />)}
        </>
    );
};

export { GraphFilter };
