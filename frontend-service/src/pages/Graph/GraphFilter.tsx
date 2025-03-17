import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import { Autocomplete, Checkbox, Chip, Divider, Grid, IconButton, ListItemText, MenuItem, TextField, Typography } from '@mui/material';
import i18next from 'i18next';
import debounce from 'lodash/debounce';
import React, { useCallback, useState } from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { CustomIcon } from '../../common/CustomIcon';
import DateRange from '../../common/inputs/DateRange';
import { UserArrayInput } from '../../common/inputs/UserArrayInput';
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

const filterOptions = {
    string: ['contains', 'notContains', 'equals', 'notEqual', 'startsWith', 'endsWith'],
    number: ['equals', 'notEqual', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'inRange'],
};

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

    const textFieldStyle = {
        '& .MuiInputBase-root': {
            borderRadius: '7px',
            backgroundColor: darkMode ? '#4949499e' : 'white',
        },
        '& .MuiInputBase-input': {
            color: ' rgba(83, 86, 110, 1)',
            fontSize: '14px',
            fontWeight: '400',
        },
        '& fieldset': {
            borderColor: '#CCCFE5',
            color: '#CCCFE5',
        },
        '& label': {
            color: '#9398C2',
        },
    };

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
                <Grid container justifyContent="center">
                    <TextField
                        select
                        size="small"
                        fullWidth
                        sx={textFieldStyle}
                        value={filterField?.filterType === 'text' ? (filterField as IAGGridTextFilter).filter : ''}
                        onChange={(e) => handleFilterFieldChange({ type: 'equals', filter: e.target.value } as IAGGridTextFilter)}
                        inputProps={{
                            readOnly,
                            style: {
                                textOverflow: 'ellipsis',
                            },
                        }}
                    >
                        {propEnum.map((option, index) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <MenuItem key={index} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
            );

        if (format === 'date-time' || format === 'date')
            return (
                <Grid container justifyContent="center">
                    <TextField
                        fullWidth
                        select
                        size="small"
                        value={(filterField as IAGGridDateFilter).type || ''}
                        inputProps={{
                            readOnly,
                            style: {
                                textOverflow: 'ellipsis',
                            },
                        }}
                        onChange={(e) =>
                            handleFilterTypeChange(e.target.value as IAGGridDateFilter['type'], Boolean((filterField as IAGGridDateFilter).dateFrom))
                        }
                        SelectProps={{
                            IconComponent: IoIosArrowDown,
                        }}
                        sx={{ mb: 4, ...textFieldStyle }}
                    >
                        {filterOptions.number.map((option, index) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <MenuItem key={index} value={option}>
                                {i18next.t(`filters.${option}`)}
                            </MenuItem>
                        ))}
                    </TextField>
                    <DateRange
                        onStartDateChange={(newValue) => handleDateChange(newValue, true)}
                        onEndDateChange={(newValue) => handleDateChange(newValue, false)}
                        startDateInput={filterField?.filterType === 'date' && filterField.dateFrom ? filterField.dateFrom : null}
                        endDateInput={filterField?.filterType === 'date' && filterField.dateTo ? filterField.dateTo : null}
                        maxEndDate={new Date()}
                        maxStartDate={new Date()}
                        directionIsRow={entityFilter}
                        overrideSx={{
                            '& input': {
                                backgroundColor: '#FFFF',
                            },
                            spacing: 0,
                        }}
                    />
                </Grid>
            );

        if (type === 'boolean')
            return (
                <Grid container justifyContent="center">
                    <TextField
                        select
                        size="small"
                        sx={textFieldStyle}
                        fullWidth
                        value={filterField?.filterType === 'text' ? filterField?.filter : ''}
                        onChange={(e) => {
                            handleFilterFieldChange({ ...filterField, type: 'equals', filter: e.target.value } as IAGGridTextFilter);
                        }}
                        inputProps={{
                            readOnly,
                            style: {
                                textOverflow: 'ellipsis',
                            },
                        }}
                    >
                        <MenuItem value="true">{i18next.t('booleanOptions.yes')}</MenuItem>
                        <MenuItem value="false">{i18next.t('booleanOptions.no')}</MenuItem>
                    </TextField>
                </Grid>
            );

        if (items && selectedTemplate.properties.properties[selectedProperty].items?.enum)
            return (
                <Grid container justifyContent="center">
                    <TextField
                        select
                        rows={2}
                        size="small"
                        fullWidth
                        sx={textFieldStyle}
                        value={filterField?.filterType === 'set' && filterField.values ? filterField.values : []}
                        onChange={() => {}}
                        inputProps={{
                            readOnly,
                            style: {
                                textOverflow: 'ellipsis',
                            },
                        }}
                        SelectProps={{
                            multiple: true,
                            renderValue: (selected: any) => (
                                <div>
                                    {selected.map((value: string) => (
                                        <Chip key={value} label={value} style={{ marginRight: 5 }} />
                                    ))}
                                </div>
                            ),
                        }}
                    >
                        {selectedTemplate.properties.properties[selectedProperty].items?.enum?.map((option, index) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <MenuItem key={index} value={option}>
                                <Checkbox
                                    checked={filterField?.filterType === 'set' ? filterField.values.includes(option) : false}
                                    onChange={(e) => handleCheckboxChange(option, e.target.checked)}
                                />
                                <ListItemText primary={option} />
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
            );

        if (items?.format === 'user' && type === 'array')
            return (
                <UserArrayInput
                    mode="external"
                    value={null}
                    label=""
                    onChange={(_e, chosenUser, reason) => {
                        if (reason !== 'selectOption' || !chosenUser) return;
                        if (filterField?.filterType === 'set') handleCheckboxChange(chosenUser.fullName, true);

                        setInputValue('');
                    }}
                    isError={false}
                    displayValue={inputValue}
                    onDisplayValueChange={(_, newDisplayValue) => setInputValue(newDisplayValue)}
                    currentUsers={filterField?.filterType === 'set' ? (filterField.values as string[]) : []}
                    onRemove={(index) => {
                        if (filterField?.filterType !== 'set') return undefined;
                        const currentUser = filterField.values[index];
                        handleCheckboxChange(currentUser as string, false);
                        return undefined;
                    }}
                    overrideSx={textFieldStyle}
                />
            );

        return (
            <Grid container justifyContent="center" direction={entityFilter ? 'row' : 'column'} spacing={2}>
                <Grid item xs={entityFilter ? 5 : 12}>
                    {/* TODO : same height after defining fontsize */}
                    <TextField
                        fullWidth
                        select
                        size="small"
                        sx={textFieldStyle}
                        value={(filterField as IAGGridTextFilter | IAGGidNumberFilter).type || ''}
                        inputProps={{
                            readOnly,
                            style: {
                                textOverflow: 'ellipsis',
                            },
                        }}
                        onChange={(e) =>
                            handleFilterTypeChange(
                                e.target.value as IAGGidNumberFilter['type'] | IAGGridTextFilter['type'],
                                Boolean((filterField as IAGGidNumberFilter | IAGGridTextFilter).filter),
                            )
                        }
                        SelectProps={{
                            IconComponent: IoIosArrowDown,
                        }}
                    >
                        {filterOptions[type].map((option, index) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <MenuItem key={index} value={option}>
                                {i18next.t(`filters.${option}`)}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                <Grid item xs={entityFilter ? 7 : 12}>
                    <TextField
                        inputProps={{
                            readOnly,
                            style: {
                                textOverflow: 'ellipsis',
                            },
                        }}
                        size="small"
                        fullWidth
                        sx={textFieldStyle}
                        type={selectedTemplate?.properties.properties[selectedProperty].type}
                        value={filterField && 'filter' in filterField ? filterField.filter ?? '' : ''}
                        onChange={(e) => {
                            const { value } = e.target;

                            const updatedFilter =
                                type === 'number'
                                    ? ({ ...filterField, filter: value ? Number(value) : undefined } as IAGGidNumberFilter)
                                    : ({ ...filterField, filter: value } as IAGGridTextFilter);

                            handleFilterFieldChange(updatedFilter, Boolean(filterField && 'type' in filterField && filterField.type && value));
                        }}
                    />
                </Grid>
            </Grid>
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
                                    style={{ width: '195px', margin: 'auto', paddingBottom: '10px' }}
                                    value={null}
                                    onChange={(_event, newValue) => handleSelectTemplate(newValue)}
                                    options={options}
                                    getOptionLabel={(option) => option.displayName}
                                    renderInput={(params) => (
                                        <TextField {...params} variant="outlined" sx={{ borderRadius: '5px', ...textFieldStyle }} />
                                    )}
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
                        <Grid item sx={{ height: '90px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {!entityFilter && <Divider sx={{ width: '195px', margin: 'auto', border: '1px 0px 0px 0px' }} />}{' '}
                            <Autocomplete
                                popupIcon={<IoIosArrowDown size="20px" />}
                                size="small"
                                style={{ width: '90%', margin: 'auto', paddingBottom: '10px' }}
                                value={selectedProperty}
                                onChange={(_event, newValue) => handleSelectProperty(newValue)}
                                options={propOptionsNotFile}
                                getOptionLabel={(option) =>
                                    selectedTemplate?.properties.properties[option] ? selectedTemplate.properties.properties[option].title : ''
                                }
                                renderInput={(params) => (
                                    <TextField {...params} variant="outlined" sx={{ borderRadius: '5px', ...textFieldStyle }} label="שדה" />
                                )}
                            />
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
