import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import { Autocomplete, Box, Checkbox, Chip, Divider, Grid, IconButton, ListItemText, MenuItem, TextField, Typography } from '@mui/material';
import i18next from 'i18next';
import debounce from 'lodash/debounce';
import React, { useState } from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import Condition from 'yup/lib/Condition';
import { CustomIcon } from '../../common/CustomIcon';
import DateRange from '../../common/inputs/DateRange';
import { UserArrayInput } from '../../common/inputs/UserArrayInput';
import { IGraphFilterBody } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { useDarkModeStore } from '../../stores/darkMode';

interface GraphFilterProps {
    templateOptions: IMongoEntityTemplatePopulated[];
    graphEntityTemplateIds: string[];
    deleteFilter: React.Dispatch<React.SetStateAction<number>>;
    setFilters: React.Dispatch<React.SetStateAction<IGraphFilterBody[]>>;
    filterIndex: number;
    removeFilterFromFilterList: any;
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
    filterIndex,
    templateOptions,
    deleteFilter,
    setFilters,
    filter,
    graphEntityTemplateIds,
    removeFilterFromFilterList,
    onFilter,
    selectedEntityTemplate,
    readOnly = false,
}) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const [selectedTemplate, setSelectedTemplate] = useState<IMongoEntityTemplatePopulated | null>(
        filter?.selectedTemplate || selectedEntityTemplate || null,
    );
    const [selectedProperty, setSelectedProperty] = useState<string | null>(filter?.selectedProperty ?? null);
    const [filterField, setFilterField] = useState<any>(filter?.filterField || '');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [fullView, setFullView] = useState<boolean>(true);
    const [inputValue, setInputValue] = useState<string>('');
    const options = templateOptions.filter((option) => graphEntityTemplateIds.includes(option._id));
    const properties = selectedTemplate?.properties.properties;
    const propOptionsNotFile = properties
        ? Object.keys(properties).filter((prop) => properties[prop].format !== 'fileId' && properties[prop].items?.format !== 'fileId')
        : [];
    const x = true;

    const handleSetFilterRecord = (newFilterField, condition: boolean = true) => {
        if (condition)
            setFilters((prev) => {
                const updatedFilters = [...prev];
                updatedFilters[filterIndex] = { selectedTemplate, selectedProperty, filterField: newFilterField };

                return updatedFilters;
            });

        // if (condition)
        //     debouncedOnFilter({
        //         [filterIndex]: { selectedTemplate, selectedProperty, filterField: newFilterField },
        //     });
    };

    const handleStartDate = (newValue) => {
        if (!newValue && !endDate) {
            removeFilterFromFilterList(filterIndex);
        } else {
            setStartDate(newValue);
            handleSetFilterRecord([newValue, endDate], newValue && endDate);
        }
    };
    const handleEndDate = (newValue) => {
        if (!startDate && !newValue) {
            removeFilterFromFilterList(filterIndex);
        } else {
            setEndDate(newValue);
            handleSetFilterRecord([startDate, newValue], newValue && startDate);
        }
    };

    const handleCheckboxChange = (option, checked) => {
        const updatedFilterField = checked ? [...filterField, option] : filterField.filter((item) => item !== option);
        setFilterField(updatedFilterField);
        if (updatedFilterField.length === 0) {
            removeFilterFromFilterList(filterIndex);
        } else {
            handleSetFilterRecord(updatedFilterField);
        }
    };

    const handleSelectTemplate = (newValue: IMongoEntityTemplatePopulated | null) => {
        setSelectedTemplate(newValue);
        setSelectedProperty(null);
        setFilterField('');
        if (!newValue && selectedProperty) {
            removeFilterFromFilterList(filterIndex);
        }
    };

    const handleSelectProperty = (newValue) => {
        setSelectedProperty(newValue);
        setFilterField('');
        if (!newValue && filterField) {
            removeFilterFromFilterList(filterIndex);
        }
    };

    const handleFilterTypeChange = (value) => {
        console.log(
            'aaaaaaaaaaaaaaaaa',
            { filterField },
            { ...filterField, type: value },
            Boolean(filterField.filter !== '' && value),
            filterField.filter !== '',
            value,
        );

        setFilterField({ ...filterField, type: value });
        if (value === '' && typeof filterField !== 'object') {
            removeFilterFromFilterList(filterIndex);
        } else {
            // Use a default value (empty string) if filterField.filter is undefined.
            const currentFilter = filterField.filter ?? '';
            console.log({ currentFilter }, currentFilter !== '', Boolean(value), currentFilter !== '' && Boolean(value));

            // Call onFilter only if there is a filter value and value is truthy.
            handleSetFilterRecord({ ...filterField, type: value }, currentFilter !== '' && Boolean(value));
        }
    };

    const handleFilterFieldChange = (value, condition: boolean = true) => {
        console.log({ value });

        setFilterField(value);
        if (value === '' && typeof filterField !== 'object') {
            removeFilterFromFilterList(filterIndex);
        } else {
            handleSetFilterRecord(value, condition);
        }
    };

    const handleFilterErasion = () => {
        removeFilterFromFilterList(filterIndex);
        deleteFilter(filterIndex);
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
                    <DateRange
                        onStartDateChange={handleStartDate}
                        onEndDateChange={handleEndDate}
                        startDateInput={startDate}
                        endDateInput={endDate}
                        maxEndDate={new Date()}
                        maxStartDate={new Date()}
                        directionIsRow
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
            <Grid container justifyContent="center" spacing={1}>
                <Grid item width={x ? '40%' : '100%'}>
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
                    >
                        {filterOptions[type].map((option, index) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <MenuItem key={index} value={option}>
                                {i18next.t(`filters.${option}`)}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                <Grid item width={x ? '60%' : '100%'}>
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
                            console.log({ curr: filterField, condition: filterField.type && e.target.value });

                            handleFilterFieldChange({ ...filterField, filter: e.target.value }, Boolean(filterField.type && e.target.value));
                        }}
                    />
                </Grid>
            </Grid>
        );
    };

    return (
        <>
            {x ? (
                <>
                    <Grid
                        sx={{
                            backgroundColor: darkMode ? '#121212' : '#EBEFFA33',
                            width: '100%',
                            height: '100%',
                        }}
                        container
                        direction="column"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Grid container marginTop={2} marginBottom={2} justifyContent="space-between" wrap="nowrap" width="90%">
                            <Autocomplete
                                popupIcon={<IoIosArrowDown size="15px" />}
                                value={selectedProperty}
                                sx={{ width: '1000%' }}
                                onChange={(_event, newValue) => handleSelectProperty(newValue)}
                                options={propOptionsNotFile}
                                getOptionLabel={(option) =>
                                    selectedTemplate?.properties.properties[option] ? selectedTemplate.properties.properties[option].title : ''
                                }
                                renderInput={(params) => <TextField {...params} variant="outlined" sx={{ borderRadius: '5px' }} label="שדה" />}
                            />

                            <IconButton onClick={handleFilterErasion}>
                                <CloseIcon fontSize="small" sx={{ color: '#1E2775' }} />
                            </IconButton>
                        </Grid>

                        <Grid item container justifyContent="center">
                            <Grid item style={{ width: '90%', marginBottom: '16px' }}>
                                {renderFilterInput()}
                            </Grid>
                        </Grid>
                    </Grid>
                    <Divider sx={{ width: '100%', margin: '8px', border: '1px 0px 0px 0px', color: '#EBEFFA' }} />
                </>
            ) : (
                <Grid
                    sx={{
                        backgroundColor: darkMode ? '#121212' : 'white',
                        marginBottom: '5px',
                        borderRadius: '10px',
                        boxShadow: '0px 2px 1px -1px rgba(0,0,0,0.2)',
                        overflow: 'hidden',
                        width: '100%',
                        maxWidth: '247px',
                    }}
                    container
                    direction="column"
                >
                    <Grid item sx={{ position: 'relative' }}>
                        <Grid
                            item
                            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '40px' }} // Set a fixed height
                        >
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
                            <Box>
                                <IconButton onClick={() => setFullView(!fullView)}>
                                    {fullView ? <KeyboardArrowDown fontSize="small" /> : <KeyboardArrowUp fontSize="small" />}
                                </IconButton>

                                <IconButton onClick={handleFilterErasion}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Grid>
                        <Box display={fullView ? undefined : 'none'}>
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
                                        {selectedTemplate?.iconFileId && (
                                            <CustomIcon iconUrl={selectedTemplate?.iconFileId} height="24px" width="24px" />
                                        )}
                                    </Grid>
                                    <Grid item>
                                        <Typography variant="subtitle1">{selectedTemplate?.displayName}</Typography>
                                    </Grid>
                                    <Grid item>
                                        <IconButton onClick={() => handleSelectTemplate(null)}>
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            )}
                        </Box>
                    </Grid>
                    <Box display={fullView ? undefined : 'none'}>
                        {selectedTemplate && (
                            <Grid item sx={{ height: '90px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Divider sx={{ width: '195px', margin: 'auto', border: '1px 0px 0px 0px' }} />
                                <Autocomplete
                                    popupIcon={<IoIosArrowDown size="20px" />}
                                    size="small"
                                    style={{ width: '80%', margin: 'auto', paddingBottom: '10px' }}
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
                                <Grid item style={{ width: '80%', paddingBottom: '10px' }}>
                                    {renderFilterInput()}
                                </Grid>
                            </Grid>
                        )}
                    </Box>
                </Grid>
            )}
        </>
    );
};

export { GraphFilter };
