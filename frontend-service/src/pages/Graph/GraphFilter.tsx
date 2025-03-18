import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import { Autocomplete, Divider, Grid, IconButton, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import debounce from 'lodash/debounce';
import React, { useCallback, useState } from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { CustomIcon } from '../../common/CustomIcon';
import { BooleanFilterInput } from '../../common/inputs/FilterInputs/BooleanFilterInput';
import { DateFilterInput } from '../../common/inputs/FilterInputs/DateFilterInput';
import { MultipleSelectFilterInput } from '../../common/inputs/FilterInputs/MultipleSelectFilterInput';
import { MultipleUserFilterInput } from '../../common/inputs/FilterInputs/MultipleUserFilterInput';
import { SelectFilterInput } from '../../common/inputs/FilterInputs/SelectFilterInput';
import { StyledFilterInput } from '../../common/inputs/FilterInputs/StyledFilterInput';
import { TextFilterInput } from '../../common/inputs/FilterInputs/TextFilterInput';
import { IGraphFilterBody, IGraphFilterBodyBatch } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { useDarkModeStore } from '../../stores/darkMode';
import { IAGGidNumberFilter, IAGGridDateFilter, IAGGridSetFilter, IAGGridTextFilter } from '../../utils/agGrid/interfaces';

interface GraphFilterProps {
    templateOptions: IMongoEntityTemplatePopulated[];
    graphEntityTemplateIds: string[];
    deleteFilter: React.Dispatch<React.SetStateAction<number>>;
    setFilterRecord: React.Dispatch<React.SetStateAction<IGraphFilterBodyBatch>>;
    filterKey: number;
    removeFilterFromFilterList: (filterKey: number) => void;
    entityFilter: boolean;
    filter?: IGraphFilterBody;
    onFilter: () => void;
    selectedEntityTemplate?: IMongoEntityTemplatePopulated | null;
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
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const theme = useTheme();
    const [selectedTemplate, setSelectedTemplate] = useState<IMongoEntityTemplatePopulated | null>(
        filter?.selectedTemplate || selectedEntityTemplate || null,
    );
    const [selectedProperty, setSelectedProperty] = useState<string | null>(filter?.selectedProperty ?? null);
    const [filterField, setFilterField] = useState<IGraphFilterBody['filterField']>(filter?.filterField || undefined);
    const [fullView, setFullView] = useState<boolean>(true);
    const [inputValue, setInputValue] = useState<string>('');
    const options = templateOptions.filter((option) => graphEntityTemplateIds.includes(option._id));
    const properties = selectedTemplate?.properties.properties;
    const propOptionsNotFile = properties
        ? Object.keys(properties).filter((prop) => properties[prop].format !== 'fileId' && properties[prop].items?.format !== 'fileId')
        : [];

    const debouncedOnFilter = useCallback(
        debounce((newFilterField) => {
            setFilterRecord((prev) => ({
                ...prev,
                [filterKey]: {
                    selectedTemplate,
                    selectedProperty,
                    filterField: newFilterField,
                },
            }));

            onFilter();
        }, 500),
        [filterKey, selectedTemplate, selectedProperty],
    );

    const handleSelectTemplate = (newValue: IMongoEntityTemplatePopulated | null) => {
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

        const { format, type } = selectedTemplate.properties.properties[newProperty];

        const initializedFilterField: Record<string, IGraphFilterBody['filterField']> = {
            'date-time': { filterType: 'date', type: 'equals', dateFrom: null, dateTo: null },
            date: { filterType: 'date', type: 'equals', dateFrom: null, dateTo: null },
            number: { filterType: 'number', type: 'equals' },
            string: { filterType: 'text', type: 'contains' },
            boolean: { filterType: 'text', type: 'equals' },
            array: { filterType: 'set', values: [] },
        };

        const selectedFilter = (format && initializedFilterField[format]) || (type && initializedFilterField[type]);

        if (selectedFilter) setFilterField(selectedFilter);
    };

    const handleSetFilterRecord = (newFilterField: IGraphFilterBody['filterField'], condition: boolean = true) => {
        if (condition) debouncedOnFilter(newFilterField);
    };

    const handleFilterFieldChange = (value: IGraphFilterBody['filterField'], condition: boolean = true) => {
        setFilterField(value);

        if (value?.filterType === 'number' || value?.filterType === 'text')
            if (!value.filter) {
                removeFilterFromFilterList(filterKey);
                return;
            }

        handleSetFilterRecord(value, condition);
    };

    const handleDateChange = (newValue: Date | null, isStartDate: boolean) => {
        if (!newValue && filterField?.filterType === 'date') {
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
            } as IAGGridDateFilter,
            Boolean(
                isStartDate
                    ? filterField?.filterType === 'date' && (filterField.type !== 'inRange' || filterField.dateTo)
                    : newValue && filterField?.filterType === 'date' && filterField.type === 'inRange' && filterField.dateFrom,
            ),
        );
    };

    const handleCheckboxChange = (option: string, checked: boolean) => {
        const { values } = filterField as IAGGridSetFilter;

        const updatedValues = checked ? [...values, option] : values?.filter((item) => item !== option);
        const updatedFilterField = { ...filterField, values: updatedValues } as IAGGridSetFilter;

        setFilterField(updatedFilterField);
        if (updatedValues.length === 0) removeFilterFromFilterList(filterKey);
        else handleSetFilterRecord(updatedFilterField);
    };

    const handleFilterTypeChange = (
        newTypeFilter: IAGGridDateFilter['type'] | IAGGridTextFilter['type'] | IAGGidNumberFilter['type'],
        condition: boolean = true,
    ) => {
        handleFilterFieldChange({ ...filterField, type: newTypeFilter } as IAGGridDateFilter | IAGGridTextFilter | IAGGidNumberFilter, condition);
    };

    const handleFilterErasion = () => {
        removeFilterFromFilterList(filterKey);
        deleteFilter(filterKey);
    };

    const renderFilterInput = () => {
        if (!(selectedProperty && selectedTemplate)) return null;
        const { format, enum: propEnum, type, items } = selectedTemplate.properties.properties[selectedProperty];
        // no files in graph filter
        if (items?.format === 'fileId' || format === 'fileId') return null;

        if (propEnum)
            return (
                <SelectFilterInput
                    filterField={filterField?.filterType === 'text' ? (filterField as IAGGridTextFilter) : undefined}
                    enumOptions={propEnum}
                    handleFilterFieldChange={handleFilterFieldChange}
                    readOnly={readOnly}
                />
            );

        if (format === 'date-time' || format === 'date')
            return (
                <DateFilterInput
                    filterField={filterField?.filterType === 'date' ? (filterField as IAGGridDateFilter) : undefined}
                    handleFilterTypeChange={handleFilterTypeChange}
                    handleDateChange={handleDateChange}
                    readOnly={readOnly}
                    entityFilter={entityFilter}
                />
            );

        if (type === 'boolean')
            return (
                <BooleanFilterInput
                    filterField={filterField?.filterType === 'text' ? (filterField as IAGGridTextFilter) : undefined}
                    handleFilterFieldChange={handleFilterFieldChange}
                    readOnly={readOnly}
                />
            );

        if (items && selectedTemplate.properties.properties[selectedProperty].items?.enum)
            return (
                <MultipleSelectFilterInput
                    filterField={filterField?.filterType === 'set' ? (filterField as IAGGridSetFilter) : undefined}
                    handleCheckboxChange={handleCheckboxChange}
                    enumOptions={items?.enum}
                    readOnly={readOnly}
                />
            );

        if (items?.format === 'user' && type === 'array')
            return (
                <MultipleUserFilterInput
                    filterField={filterField?.filterType === 'set' ? (filterField as IAGGridSetFilter) : undefined}
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    handleCheckboxChange={handleCheckboxChange}
                    readOnly={readOnly}
                />
            );
        return (
            <TextFilterInput
                entityFilter={entityFilter}
                filterField={
                    filterField?.filterType === 'number' || filterField?.filterType === 'text'
                        ? (filterField as IAGGidNumberFilter | IAGGridTextFilter)
                        : undefined
                }
                handleFilterFieldChange={handleFilterFieldChange}
                handleFilterTypeChange={handleFilterTypeChange}
                type={type}
                readOnly={readOnly}
            />
        );
    };

    return (
        <>
            <Grid
                sx={{
                    // eslint-disable-next-line no-nested-ternary
                    backgroundColor: darkMode ? '#121212' : entityFilter ? '#EBEFFA33' : 'white',
                    ...(entityFilter ? {} : { borderRadius: '10px', boxShadow: '0px 2px 1px -1px rgba(0,0,0,0.2)', marginBottom: '5px' }),
                }}
            >
                {!entityFilter && (
                    <Grid item sx={{ position: 'relative' }}>
                        <Grid item sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '40px' }}>
                            <Typography
                                style={{
                                    fontWeight: '500',
                                    fontFamily: 'Rubik',
                                    fontSize: '14px',
                                    padding: '15px',
                                    marginRight: '7px',
                                }}
                                variant="body1"
                            >
                                {i18next.t('graph.filterEntity')}
                            </Typography>
                            <Grid>
                                <IconButton onClick={() => setFullView(!fullView)}>
                                    {fullView ? <KeyboardArrowDown fontSize="small" /> : <KeyboardArrowUp fontSize="small" />}
                                </IconButton>

                                <IconButton onClick={handleFilterErasion}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Grid>
                        </Grid>
                        <Grid display={fullView ? undefined : 'none'}>
                            {!selectedTemplate && (
                                <Autocomplete
                                    popupIcon={<IoIosArrowDown size="20px" />}
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
                                    <Grid item>
                                        {selectedTemplate.iconFileId && (
                                            <CustomIcon iconUrl={selectedTemplate.iconFileId} height="24px" width="24px" />
                                        )}
                                    </Grid>
                                    <Grid item>
                                        <Typography variant="subtitle1">{selectedTemplate.displayName}</Typography>
                                    </Grid>
                                    <Grid item>
                                        <IconButton onClick={() => handleSelectTemplate(null)}>
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            )}
                        </Grid>
                    </Grid>
                )}
                <Grid display={fullView ? undefined : 'none'}>
                    {selectedTemplate && (
                        <Grid
                            item
                            sx={{
                                height: '90px',
                                display: 'flex',
                                flexDirection: entityFilter ? 'row' : 'column',
                                alignItems: 'center',
                            }}
                        >
                            {!entityFilter && <Divider sx={{ width: '90%', margin: 'auto', border: '1px 0px 0px 0px' }} />}
                            <Autocomplete
                                popupIcon={<IoIosArrowDown size="20px" />}
                                size="small"
                                sx={{
                                    width: '90%',
                                    ...(entityFilter ? { marginLeft: '5%' } : { margin: 'auto', paddingBottom: '10px' }),
                                }}
                                value={selectedProperty}
                                onChange={(_event, newValue) => handleSelectProperty(newValue)}
                                options={propOptionsNotFile}
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
                            />
                            {entityFilter && (
                                <IconButton onClick={handleFilterErasion}>
                                    <CloseIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                                </IconButton>
                            )}
                        </Grid>
                    )}

                    {selectedProperty && (
                        <Grid item container justifyContent="center">
                            <Grid item style={{ width: '90%', paddingBottom: '10px' }}>
                                {renderFilterInput()}
                            </Grid>
                        </Grid>
                    )}
                </Grid>
            </Grid>
            {entityFilter && <Divider sx={{ width: '100%', margin: '8px', border: '1px 0px 0px 0px', color: '#EBEFFA' }} />}{' '}
        </>
    );
};

export { GraphFilter };
