/* eslint-disable react-hooks/exhaustive-deps */
import { FilterList } from '@mui/icons-material';
import { Autocomplete, Box, Button, Divider, Grid, TextField, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import { ColoredEnumChip } from '../../../common/ColoredEnumChip';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import SearchInput from '../../../common/inputs/SearchInput';
import { FilterLogicalOperator, IEntity, IFilterOfField } from '../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { getEntitiesWithDirectConnections } from '../../../services/entitiesService';
import { useDarkModeStore } from '../../../stores/darkMode';

type Props = {
    moveToEntityLocations: (entity: IEntity[]) => void;
    entityTemplateMap: IEntityTemplateMap;
    darkMode: boolean;
    clearAutocompleteSearch: () => void;
    sourceTemplate?: IMongoEntityTemplatePopulated;
    filters: {
        value: { autoSearch: string; listFields: Record<string, IFilterOfField['$in']> };
        set: React.Dispatch<React.SetStateAction<{ autoSearch: string; listFields: Record<string, IFilterOfField['$in']> }>>;
    };
};

const MapFilters = ({ moveToEntityLocations, entityTemplateMap, clearAutocompleteSearch, sourceTemplate, filters }: Props) => {
    const theme = useTheme();
    const [openFilter, setOpenFilter] = useState(false);

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const templatesWithLocationField = Array.from(entityTemplateMap.values()).filter((key) =>
        Object.values(key.properties.properties).some((obj) => obj.format === 'location'),
    );
    const sourceListsFields = sourceTemplate
        ? Object.entries(sourceTemplate.properties.properties)
              .filter(([_, prop]) => prop.enum || prop.items?.enum)
              .map(([key, prop]) => ({
                  name: key,
                  ...prop,
              }))
        : [];

    console.log({ sourceListsFields });

    const templates = templatesWithLocationField
        .map(({ _id }) => _id)
        .reduce(
            (acc, templateId) => {
                acc[templateId] = {
                    ...(templateId === sourceTemplate?._id && Object.entries(filters.value.listFields).length
                        ? {
                              filter: {
                                  [FilterLogicalOperator.AND]: Object.entries(filters.value.listFields).map(([field, values]) => ({
                                      [field]: { $in: values },
                                  })),
                              },
                          }
                        : {}),
                };
                return acc;
            },
            {} as Record<string, any>,
        );

    const { data, isLoading, error, refetch } = useQuery(
        ['searchEntitiesOfTemplates', filters.value.autoSearch],
        async () => {
            if (Object.keys(templatesWithLocationField).length === 0) {
                return { count: 0, entities: [] };
            }

            const result = await getEntitiesWithDirectConnections({
                skip: 0,
                limit: 1001,
                textSearch: filters.value.autoSearch,
                templates,
            });

            return result;
        },
        {
            enabled: false,
            onSuccess: (data) => {
                if (data.count > 1000) toast.error(i18next.t('templateEntitiesAutocomplete.tooManyResults', { count: data.count }));
                else moveToEntityLocations(data.entities.map((entity) => entity.entity));
            },
            onError: () => {
                toast.error(i18next.t('templateEntitiesAutocomplete.failedToSearchEntities'));
            },
        },
    );

    return (
        <Grid zIndex={1000} top={10} container wrap="nowrap" gap="15px">
            <Grid>
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
                    <Grid container justifyContent="space-between" alignItems="center">
                        <Typography color={theme.palette.primary.main} fontSize="12px">
                            {data && Array.isArray(data.entities) && data.entities.length > 0 && (
                                <>{i18next.t('location.showingEntitiesCount', { count: data.entities.length })}</>
                            )}
                        </Typography>

                        <Button
                            sx={{
                                color: '#4752B6',
                                fontWeight: 400,
                                fontSize: '12px',
                                textDecoration: 'underline',
                                ':hover': { textDecoration: 'underline' },
                            }}
                            disabled={!Object.entries(filters.value.listFields).length && !filters.value.autoSearch.length}
                            onClick={() => {
                                clearAutocompleteSearch();
                                filters.set({ autoSearch: '', listFields: {} });
                            }}
                        >
                            {i18next.t('location.clearFilter')}
                        </Button>
                    </Grid>
                    <Divider />
                    {/* 
                    <SearchAutoComplete
                        selectedTemplates={templatesWithLocationField}
                        handleEntityClick={moveToEntityLocations}
                        onClear={clearAutocompleteSearch}
                        filters={filters}
                    /> */}

                    <SearchInput
                        value={filters.value.autoSearch}
                        showBorder
                        placeholder="חיפוש בעמוד"
                        onChange={(newSearchValue: string) => filters.set((prev) => ({ ...prev, autoSearch: newSearchValue }))}
                    />

                    <Divider />
                    <Box maxHeight={350} overflow="auto" display="flex" flexDirection="column" gap={2} paddingTop={1}>
                        {sourceListsFields.length > 0 &&
                            sourceListsFields.map((field, index) => (
                                <Autocomplete
                                    key={`${field.name}-${index}`}
                                    multiple
                                    options={field.enum ?? field.items?.enum ?? []}
                                    onChange={(_e, newValue) => {
                                        filters.set((prev) => ({
                                            ...prev,
                                            listFields: {
                                                ...prev.listFields,
                                                [field.name]: newValue,
                                            },
                                        }));
                                    }}
                                    value={filters.value.listFields[field.name] || []}
                                    renderTags={(selected) =>
                                        selected.map((option) => (
                                            <ColoredEnumChip
                                                key={String(option)}
                                                label={String(option)}
                                                style={{ backgroundColor: darkMode ? '#53566E' : '#EBEFFA', margin: '3px', borderRadius: '10px' }}
                                            />
                                        ))
                                    }
                                    renderInput={(params) => <TextField {...params} fullWidth label={field.title} />}
                                    popupIcon={<IoIosArrowDown fontSize="Medium" color={'#CCCFE5'} />}
                                />
                            ))}
                    </Box>

                    <Button
                        disabled={!Object.entries(filters.value.listFields).length && !filters.value.autoSearch.length}
                        variant="contained"
                        sx={{ width: 'auto', alignSelf: 'end', borderRadius: '7px' }}
                        onClick={() => refetch()}
                    >
                        {i18next.t('location.search')}
                    </Button>
                </Grid>
            )}
        </Grid>
    );
};

export default MapFilters;
