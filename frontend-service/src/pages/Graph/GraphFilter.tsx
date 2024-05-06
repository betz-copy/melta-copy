import React, { useState } from 'react';
import { Autocomplete, Box, Button, Checkbox, Chip, Divider, Grid, IconButton, ListItemText, MenuItem, TextField, Typography } from '@mui/material';
import { IoIosArrowDown } from 'react-icons/io';
import CloseIcon from '@mui/icons-material/Close';
import i18next from 'i18next';
import ClearIcon from '@mui/icons-material/Clear';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import DateRange from '../../common/inputs/DateRange';
import { IGraphFilterBody, IGraphFilterBodyBatch } from '../../interfaces/entities';
import { CustomIcon } from '../../common/CustomIcon';

interface GraphFilterProps {
    templateOptions: IMongoEntityTemplatePopulated[];
    graphEntityTemplateIds: string[];
    deleteFilter: React.Dispatch<React.SetStateAction<number>>;
    setFilterRecord: React.Dispatch<React.SetStateAction<IGraphFilterBodyBatch>>;
    filterKey: number;
    removeFilterFromFilterList: any;
    filter?: IGraphFilterBody;
}

const GraphFilter: React.FC<GraphFilterProps> = ({
    filterKey,
    templateOptions,
    deleteFilter,
    setFilterRecord,
    filter,
    graphEntityTemplateIds,
    removeFilterFromFilterList,
}) => {
    // const darkMode = useSelector((state: RootState) => state.darkMode);
    const [selectedTemplate, setSelectedTemplate] = useState<IMongoEntityTemplatePopulated | null>(filter?.selectedTemplate || null);
    const [selectedProperty, setSelectedProperty] = useState<string | null>(
        filter?.selectedProperty ? filter?.selectedTemplate[filter?.selectedProperty] : null,
    );
    const [filterField, setFilterField] = useState<any>(filter?.filterField || '');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const options = templateOptions.filter((option) => graphEntityTemplateIds.includes(option._id));
    const properties = selectedTemplate?.properties.properties;
    const propOptionsNotFile = properties
        ? Object.keys(properties).filter((prop) => properties[prop].format !== 'fileId' && properties[prop].items?.format !== 'fileId')
        : [];

    const handleSetFilterRecord = (newFilterField) => {
        setFilterRecord((prev) => ({
            ...prev,
            [filterKey]: { selectedTemplate, selectedProperty, filterField: newFilterField },
        }));
    };
    const handleStartDate = (newValue) => {
        if (!newValue && !endDate) {
            removeFilterFromFilterList(filterKey);
        } else {
            setStartDate(newValue);
            handleSetFilterRecord([newValue, endDate]);
        }
    };
    const handleEndDate = (newValue) => {
        if (!startDate && !newValue) {
            removeFilterFromFilterList(filterKey);
        } else {
            setEndDate(newValue);
            handleSetFilterRecord([startDate, newValue]);
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

    const handleFilterFieldChange = (value) => {
        setFilterField(value);
        if (value === '') {
            removeFilterFromFilterList(filterKey);
        } else {
            handleSetFilterRecord(value);
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
        if (items?.format === 'fileId' || format === 'fileId') {
            return null;
        }
        if (propEnum) {
            return (
                <Grid container justifyContent="center">
                    <TextField
                        select
                        size="small"
                        sx={{ width: '100%' }}
                        value={filterField || ''}
                        onChange={(e) => handleFilterFieldChange(e.target.value)}
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
        }

        if (format === 'date-time' || format === 'date') {
            return (
                <Grid container justifyContent="center">
                    <DateRange
                        onStartDateChange={handleStartDate}
                        onEndDateChange={handleEndDate}
                        startDateInput={startDate}
                        endDateInput={endDate}
                        directionIsRow={false}
                    />
                </Grid>
            );
        }
        if (type === 'boolean') {
            return (
                <Grid container justifyContent="center">
                    <TextField
                        select
                        size="small"
                        sx={{ width: '100%' }}
                        // eslint-disable-next-line no-nested-ternary
                        value={filterField || ''}
                        onChange={(e) => {
                            if (e.target.value === 'true') handleFilterFieldChange(true);
                            else if (e.target.value === 'false') handleFilterFieldChange(false);
                            else handleFilterFieldChange('');
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
                        size="small"
                        sx={{ width: '100%' }}
                        value={filterField || []}
                        onChange={() => {}}
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

        return (
            <Grid container justifyContent="center">
                <TextField
                    rows={2}
                    size="small"
                    type={selectedTemplate?.properties.properties[selectedProperty].type}
                    value={filterField || ''}
                    onChange={(e) => handleFilterFieldChange(e.target.value)}
                    InputProps={{
                        endAdornment: filterField && (
                            <IconButton aria-label="clear input" onClick={() => handleFilterFieldChange('')}>
                                <ClearIcon fontSize="small" />
                            </IconButton>
                        ),
                    }}
                />
            </Grid>
        );
    };

    const [isHovered, setIsHovered] = useState(false);
    const [fullView, setFullView] = useState<boolean>(true);

    return (
        <Grid
            sx={{
                backgroundColor: 'white',
                marginBottom: '5px',
                borderRadius: '10px',
                boxShadow: '0px 2px 1px -1px rgba(0,0,0,0.2)',
                overflow: 'hidden',
                width: '100%',
                maxWidth: '247px',
            }}
            container
            direction="column"
            onDoubleClick={() => {
                setFullView(!fullView);
            }}
        >
            <Grid item sx={{ position: 'relative' }}>
                <Grid
                    item
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '40px' }} // Set a fixed height
                >
                    <Typography style={{ padding: '10px' }}>{i18next.t('graph.filterEntity')}</Typography>
                    <Button
                        sx={{
                            backgroundColor: 'transparent',
                            '&:hover': {
                                backgroundColor: 'transparent',
                                color: 'black',
                            },
                            color: 'grey',
                        }}
                        onClick={handleFilterErasion}
                    >
                        <CloseIcon fontSize="small" />
                    </Button>
                </Grid>
                <Box display={fullView ? undefined : 'none'}>
                    {!selectedTemplate && (
                        <Autocomplete
                            popupIcon={<IoIosArrowDown />}
                            size="small"
                            style={{ width: '80%', margin: 'auto', paddingBottom: '10px' }}
                            value={null}
                            onChange={(_event, newValue) => handleSelectTemplate(newValue)}
                            options={options}
                            getOptionLabel={(option) => option.displayName}
                            renderInput={(params) => <TextField {...params} variant="outlined" style={{ borderRadius: '5px' }} />}
                        />
                    )}
                    {selectedTemplate && (
                        <Grid
                            container
                            alignItems="center"
                            spacing={1}
                            style={{ width: '80%', margin: 'auto', height: '40px' }}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                        >
                            <Grid item>
                                {selectedTemplate.iconFileId && <CustomIcon iconUrl={selectedTemplate.iconFileId} height="24px" width="24px" />}
                            </Grid>
                            <Grid item>
                                <Typography variant="subtitle1">{selectedTemplate.displayName}</Typography>
                            </Grid>
                            <Grid item>
                                {isHovered && (
                                    <IconButton onClick={() => handleSelectTemplate(null)}>
                                        <ClearIcon />
                                    </IconButton>
                                )}
                            </Grid>
                        </Grid>
                    )}
                </Box>
            </Grid>
            <Box display={fullView ? undefined : 'none'}>
                {selectedTemplate && (
                    <Grid item sx={{ height: '90px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Divider sx={{ width: '70%', margin: 'auto', borderBottomWidth: '2px' }} />
                        <Autocomplete
                            popupIcon={<IoIosArrowDown />}
                            size="small"
                            style={{ width: '80%', margin: 'auto', paddingBottom: '10px' }}
                            value={selectedProperty}
                            onChange={(_event, newValue) => handleSelectProperty(newValue)}
                            options={propOptionsNotFile}
                            getOptionLabel={(option) =>
                                selectedTemplate.properties.properties[option] ? selectedTemplate.properties.properties[option].title : ''
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
    );
};

export { GraphFilter };
