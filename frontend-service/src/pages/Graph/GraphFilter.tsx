import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import { Autocomplete, Box, Checkbox, Chip, Divider, Grid, IconButton, ListItemText, MenuItem, TextField, Typography } from '@mui/material';
import i18next from 'i18next';
import debounce from 'lodash/debounce';
import React, { useCallback, useEffect, useState } from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { CustomIcon } from '../../common/CustomIcon';
import DateRange from '../../common/inputs/DateRange';
import { UserArrayInput } from '../../common/inputs/UserArrayInput';
import { IGraphFilterBody, IGraphFilterBodyBatch } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { useDarkModeStore } from '../../stores/darkMode';

interface GraphFilterProps {
    templateOptions: IMongoEntityTemplatePopulated[];
    graphEntityTemplateIds: string[];
    deleteFilter: React.Dispatch<React.SetStateAction<number>>;
    setFilterRecord: React.Dispatch<React.SetStateAction<IGraphFilterBodyBatch>>;
    filterKey: number;
    removeFilterFromFilterList: any;
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
    useEffect(() => {
        console.log({ readOnly });
    }, [readOnly]);
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const [selectedTemplate, setSelectedTemplate] = useState<IMongoEntityTemplatePopulated | null>(
        filter?.selectedTemplate || selectedEntityTemplate || null,
    );
    const [selectedProperty, setSelectedProperty] = useState<string | null>(filter?.selectedProperty ?? null);

    console.log({ entityFilter, selectedTemplate, selectedEntityTemplate, selectedProperty, filter });

    const [filterField, setFilterField] = useState<any>(filter?.filterField || '');
    const [startDate, setStartDate] = useState<Date | null>(filter?.filterField?.filter ? filter?.filterField?.filter[0] : null);
    const [endDate, setEndDate] = useState<Date | null>(filter?.filterField?.filter ? filter?.filterField?.filter[1] : null);
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

    const handleSetFilterRecord = (newFilterField, condition: boolean = true) => {
        if (condition) debouncedOnFilter(newFilterField);
    };

    const handleStartDate = (newValue) => {
        if (!newValue && !endDate) {
            removeFilterFromFilterList(filterKey);
        } else {
            setStartDate(newValue);
            handleSetFilterRecord({ ...filterField, filter: [newValue, endDate] });
        }
    };
    const handleEndDate = (newValue) => {
        if (!startDate && !newValue) {
            removeFilterFromFilterList(filterKey);
        } else {
            setEndDate(newValue);
            handleSetFilterRecord({ ...filterField, filter: [startDate, newValue] }, newValue && startDate);
        }
    };

    const handleCheckboxChange = (option, checked) => {
        const updatedFilterField = checked ? [...filterField, option] : filterField.filter((item) => item !== option);
        setFilterField(updatedFilterField);
        if (updatedFilterField.length === 0) {
            removeFilterFromFilterList(filterKey);
        } else {
            handleSetFilterRecord(updatedFilterField);
        }
    };

    const handleSelectTemplate = (newValue: IMongoEntityTemplatePopulated | null) => {
        setSelectedTemplate(newValue);
        setSelectedProperty(null);
        setFilterField('');
        if (!newValue && selectedProperty) {
            removeFilterFromFilterList(filterKey);
        }
    };

    const handleSelectProperty = (newValue) => {
        setSelectedProperty(newValue);
        setFilterField('');
        if (!newValue && filterField) {
            removeFilterFromFilterList(filterKey);
        }
    };

    const handleFilterTypeChange = (value) => {
        setFilterField({ ...filterField, type: value });
        if (value === '' && typeof filterField !== 'object') {
            removeFilterFromFilterList(filterKey);
        } else {
            const currentFilter = filterField.filter ?? '';
            handleSetFilterRecord({ ...filterField, type: value }, currentFilter !== '' && Boolean(value));
        }
    };

    const handleFilterFieldChange = (value, condition: boolean = true) => {
        setFilterField(value);
        if (value === '' && typeof filterField !== 'object') {
            removeFilterFromFilterList(filterKey);
        } else {
            handleSetFilterRecord(value, condition);
        }
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
                        sx={{ width: '100%' }}
                        value={filterField || ''}
                        onChange={(e) => handleFilterFieldChange(e.target.value)}
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
                        value={filterField.type || ''}
                        inputProps={{
                            readOnly,
                            style: {
                                textOverflow: 'ellipsis',
                            },
                        }}
                        onChange={(e) => handleFilterTypeChange(e.target.value)}
                        SelectProps={{
                            IconComponent: IoIosArrowDown,
                        }}
                        sx={{ mb: 4 }}
                    >
                        {filterOptions.number.map((option, index) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <MenuItem key={index} value={option}>
                                {i18next.t(`filters.${option}`)}
                            </MenuItem>
                        ))}
                    </TextField>
                    <DateRange
                        onStartDateChange={handleStartDate}
                        onEndDateChange={handleEndDate}
                        startDateInput={startDate}
                        endDateInput={endDate}
                        maxEndDate={new Date()}
                        maxStartDate={new Date()}
                        directionIsRow={entityFilter}
                    />
                </Grid>
            );

        if (type === 'boolean') {
            return (
                <Grid container justifyContent="center">
                    <TextField
                        select
                        size="small"
                        sx={{ width: '100%' }}
                        // eslint-disable-next-line no-nested-ternary
                        value={filterField === true ? 'true' : filterField === false ? 'false' : ''}
                        onChange={(e) => {
                            if (e.target.value === 'true') handleFilterFieldChange(true);
                            else if (e.target.value === 'false') handleFilterFieldChange(false);
                            else handleFilterFieldChange('');
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
        }

        if (items && selectedTemplate.properties.properties[selectedProperty].items?.enum) {
            return (
                <Grid container justifyContent="center">
                    <TextField
                        select
                        rows={2}
                        size="small"
                        sx={{ width: '100%' }}
                        value={filterField || []}
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
                                <Checkbox checked={filterField.includes(option)} onChange={(e) => handleCheckboxChange(option, e.target.checked)} />
                                <ListItemText primary={option} />
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
            );
        }

        if (items?.format === 'user' && type === 'array')
            return (
                <UserArrayInput
                    mode="external"
                    value={null}
                    onChange={(_e, chosenUser, reason) => {
                        if (reason !== 'selectOption' || !chosenUser) return;
                        setFilterField((prev) => [...prev, chosenUser.fullName]);
                        handleFilterFieldChange([...filterField, chosenUser.fullName]);
                        setInputValue('');
                    }}
                    isError={false}
                    displayValue={inputValue}
                    onDisplayValueChange={(_, newDisplayValue) => setInputValue(newDisplayValue)}
                    currentUsers={filterField || []}
                    setCurrentUsers={setFilterField}
                />
            );

        return (
            <Grid container justifyContent="center" direction={entityFilter ? 'row' : 'column'} spacing={2}>
                <Grid item xs={entityFilter ? 5 : 12}>
                    <TextField
                        fullWidth
                        select
                        size="small"
                        value={filterField.type || ''}
                        inputProps={{
                            readOnly,
                            style: {
                                textOverflow: 'ellipsis',
                            },
                        }}
                        onChange={(e) => handleFilterTypeChange(e.target.value)}
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
                        type={selectedTemplate?.properties.properties[selectedProperty].type}
                        value={filterField.filter || ''}
                        onChange={(e) => {
                            handleFilterFieldChange({ ...filterField, filter: e.target.value }, Boolean(filterField.type && e.target.value));
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
                                    renderInput={(params) => <TextField {...params} variant="outlined" style={{ borderRadius: '5px' }} />}
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
                                renderInput={(params) => <TextField {...params} variant="outlined" style={{ borderRadius: '5px' }} />}
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
