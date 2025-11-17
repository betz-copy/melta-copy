/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
import { FilterList } from '@mui/icons-material';
import { Autocomplete, Box, Button, Divider, Grid, TextField, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import { ColoredEnumChip } from '../../../common/ColoredEnumChip';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import SearchInput from '../../../common/inputs/SearchInput';
import { FilterLogicalOperator, IEntity, IFilterOfField, ISearchBatchBody } from '../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { getEntitiesWithDirectConnections } from '../../../services/entitiesService';
import { useDarkModeStore } from '../../../stores/darkMode';
import { CameraFocusType } from '../../../utils/map';

type Props = {
    moveToEntityLocations: (entity: IEntity[]) => void;
    entityTemplateMap: IEntityTemplateMap;
    darkMode: boolean;
    clearAutocompleteSearch: () => void;
    filters: {
        value: { autoSearch: string; listFields: Record<string, IFilterOfField['$in']> };
        set: React.Dispatch<React.SetStateAction<{ autoSearch: string; listFields: Record<string, IFilterOfField['$in']> }>>;
    };
    sourceTemplate?: IMongoEntityTemplatePopulated;
    isSearchShape?: boolean;
    applyFilterWithShapeSearch: (filters: { autoSearch: string; listFields: Record<string, IFilterOfField['$in']> }) => void;
    setCameraFocus: (value: React.SetStateAction<CameraFocusType | null>) => void;
    numOfViewedEntitiesText?: string;
};

const MapFilters = ({
    moveToEntityLocations,
    entityTemplateMap,
    clearAutocompleteSearch,
    sourceTemplate,
    filters,
    isSearchShape,
    applyFilterWithShapeSearch,
    setCameraFocus,
    numOfViewedEntitiesText,
}: Props) => {
    const theme = useTheme();
    const [openFilter, setOpenFilter] = useState(false);

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const templatesWithLocationField = Array.from(entityTemplateMap.values()).filter((key) =>
        Object.values(key.properties.properties).some((obj) => obj.format === 'location'),
    );

    const sourceListsFields = sourceTemplate
        ? Object.entries(sourceTemplate.properties.properties ?? {})
              .filter(([_, prop]) => prop.enum || prop.items?.enum)
              .map(([key, prop]) => ({
                  name: key,
                  ...prop,
              }))
        : [];

    const templates = templatesWithLocationField.reduce<ISearchBatchBody['templates']>((acc, { _id: templateId }) => {
        const filter =
            templateId === sourceTemplate?._id && Object.keys(filters.value.listFields).length
                ? {
                      [FilterLogicalOperator.AND]: Object.entries(filters.value.listFields).map(([field, values]) => ({
                          [field]: { $in: values },
                      })),
                  }
                : undefined;

        acc[templateId] = filter ? { filter } : {};
        return acc;
    }, {});

    useEffect(() => {
        const noFilters = filters.value.autoSearch.length < 2 && !Object.keys(filters.value.listFields).length;

        if (noFilters) {
            if (isSearchShape) applyFilterWithShapeSearch({ autoSearch: '', listFields: {} });
            else clearAutocompleteSearch();
        }
    }, [filters.value.autoSearch, filters.value.listFields]);

    const { refetch } = useQuery(
        ['searchEntitiesOfTemplates', filters.value.autoSearch],
        async () => {
            if (!Object.keys(templatesWithLocationField).length) return { count: 0, entities: [] };

            return getEntitiesWithDirectConnections({
                skip: 0,
                limit: 1001,
                textSearch: filters.value.autoSearch,
                templates,
            });
        },
        {
            enabled: false,
            onSuccess: (data) => {
                if (data.count > 1000) toast.warn(i18next.t('location.tooManyResults'));
                else moveToEntityLocations(data.entities.map((entity) => entity.entity));
            },
            onError: () => {
                toast.error(i18next.t('templateEntitiesAutocomplete.failedToSearchEntities'));
            },
        },
    );

    const canSearch = () => filters.value.autoSearch.length >= 2 || Object.entries(filters.value.listFields).length > 0;

    const handleSearch = () => {
        setCameraFocus(CameraFocusType.Search);
        isSearchShape ? applyFilterWithShapeSearch(filters.value) : refetch();
    };

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
                            {numOfViewedEntitiesText}
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
                                const clearedFilters = { autoSearch: '', listFields: {} };

                                filters.set(clearedFilters);
                                if (isSearchShape) applyFilterWithShapeSearch(clearedFilters);
                            }}
                        >
                            {i18next.t('location.clearFilter')}
                        </Button>
                    </Grid>
                    <Divider />

                    <SearchInput
                        value={filters.value.autoSearch}
                        showBorder
                        placeholder={i18next.t('globalSearch.searchInPage')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (canSearch()) handleSearch();
                                e.preventDefault();
                            }
                        }}
                        onChange={(newSearchValue: string) =>
                            filters.set((prev) => ({
                                ...prev,
                                autoSearch: newSearchValue,
                                listFields: !newSearchValue.length ? {} : prev.listFields,
                            }))
                        }
                    />

                    <Divider />
                    <Box maxHeight={350} overflow="auto" display="flex" flexDirection="column" gap={2} paddingTop={1}>
                        {sourceListsFields.length > 0 &&
                            sourceListsFields.map((field, index) => (
                                <Autocomplete
                                    key={`${field.name}-${index}`}
                                    multiple
                                    options={field.enum ?? field.items?.enum ?? []}
                                    disabled={filters.value.autoSearch.length < 2}
                                    onChange={(_e, newValue) => {
                                        filters.set((prev) => {
                                            const newListFields = { ...prev.listFields };

                                            if (newValue.length === 0) delete newListFields[field.name];
                                            else newListFields[field.name] = newValue;

                                            return {
                                                ...prev,
                                                listFields: newListFields,
                                            };
                                        });
                                    }}
                                    value={filters.value.listFields[field.name] ?? []}
                                    renderValue={(selected) =>
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
                        disabled={!canSearch()}
                        variant="contained"
                        sx={{ width: 'auto', alignSelf: 'end', borderRadius: '7px' }}
                        onClick={handleSearch}
                    >
                        {i18next.t('location.search')}
                    </Button>
                </Grid>
            )}
        </Grid>
    );
};

export default MapFilters;
