/* eslint-disable react-hooks/exhaustive-deps */
import { Close, FilterList } from '@mui/icons-material';
import { Autocomplete, Box, Button, Divider, Grid, TextField, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect } from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { ColoredEnumChip } from '../../../common/ColoredEnumChip';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import { IMongoChildTemplatePopulated } from '../../../interfaces/childTemplates';
import { IEntity } from '../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import SearchAutoComplete from './SearchAutoComplete';

export const DeleteMapDataBtn = ({ onClick, darkMode }: { onClick: () => void; darkMode: boolean }) => (
    <IconButtonWithPopover
        popoverText={i18next.t('location.clear')}
        iconButtonProps={{
            onClick,
        }}
        style={{
            background: darkMode ? '#131313' : '#FFFFFF',
            borderRadius: '7px',
            height: '34px',
            opacity: 1,
        }}
    >
        <Close htmlColor={darkMode ? '#9398c2' : '#787c9e'} />
    </IconButtonWithPopover>
);

type Props = {
    selectedTemplates: IMongoEntityTemplatePopulated[];
    setSelectedTemplates: React.Dispatch<React.SetStateAction<(IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated)[]>>;
    moveToEntityLocations: (entity: IEntity) => void;
    entityTemplateMap: IEntityTemplateMap;
    onClear: () => void;
    darkMode: boolean;
    clearAutocompleteSearch: () => void;
    sourceTemplate?: IMongoEntityTemplatePopulated;
};

const MapFilters = ({
    selectedTemplates,
    setSelectedTemplates,
    moveToEntityLocations,
    entityTemplateMap,
    onClear,
    darkMode,
    clearAutocompleteSearch,
    sourceTemplate,
}: Props) => {
    const [openFilter, setOpenFilter] = React.useState(false);
    const theme = useTheme();
    const templatesWithLocationField = Array.from(entityTemplateMap.values()).filter((key) =>
        Object.values(key.properties.properties).some((obj) => obj.format === 'location'),
    );

    const sourceListsFields = sourceTemplate
        ? Object.values(sourceTemplate.properties.properties).filter(({ enum: propEnum, items }) => propEnum || items?.enum)
        : [];

    useEffect(() => {
        setSelectedTemplates(templatesWithLocationField);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Grid item zIndex={1000} top={10} container wrap="nowrap" gap="15px">
            <Grid item>
                <IconButtonWithPopover
                    popoverText={i18next.t('graph.filter')}
                    iconButtonProps={{
                        onClick: () => setOpenFilter(!openFilter),
                    }}
                    style={{
                        borderRadius: '7px',
                        width: '100px',
                        height: '35px',
                        background: darkMode ? '#121212' : '#FFFFFF',
                    }}
                >
                    <Typography fontSize={13} style={{ fontWeight: '400', padding: '0 5px', color: theme.palette.primary.main }}>
                        {i18next.t('graph.filter')}
                    </Typography>
                    <FilterList htmlColor={darkMode ? '#9398c2' : '#787c9e'} />
                </IconButtonWithPopover>
            </Grid>

            {openFilter && (
                <Grid
                    container
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        top: '3rem',
                        position: 'absolute',
                        gap: 12,
                        borderRadius: '7px',
                        width: '264px',
                        padding: '15px',
                    }}
                    bgcolor={darkMode ? '#121212' : '#FFFFFF'}
                >
                    <Grid item container justifyContent="space-between" alignItems="center">
                        <Typography color={theme.palette.primary.main} fontSize="12px">
                            מציג 12 מתוך 15 יישויות
                        </Typography>

                        <Button
                            sx={{
                                color: '#4752B6',
                                fontWeight: 400,
                                fontSize: '12px',
                                textDecoration: 'underline',
                                ':hover': { textDecoration: 'underline' },
                            }}
                        >
                            נקה סינון
                        </Button>
                    </Grid>
                    <Divider />

                    <SearchAutoComplete
                        selectedTemplates={selectedTemplates}
                        handleEntityClick={moveToEntityLocations}
                        onClear={clearAutocompleteSearch}
                    />

                    <Divider />
                    <Box maxHeight={350} overflow="auto" display="flex" flexDirection="column" gap={2} paddingTop={1}>
                        {sourceListsFields.length > 0 &&
                            sourceListsFields.map((field) => (
                                <Autocomplete
                                    multiple
                                    options={field.enum ?? field.items?.enum ?? []}
                                    renderTags={(selected) =>
                                        selected.map((option) => (
                                            <ColoredEnumChip
                                                key={option}
                                                label={option}
                                                style={{ backgroundColor: darkMode ? '#53566E' : '#EBEFFA', margin: '3px', borderRadius: '10px' }}
                                            />
                                        ))
                                    }
                                    renderInput={(params) => <TextField {...params} fullWidth label={field.title} />}
                                    popupIcon={<IoIosArrowDown fontSize="Medium" color={'#CCCFE5'} />}
                                />
                            ))}
                    </Box>
                </Grid>
            )}
        </Grid>
    );
};

export default MapFilters;
