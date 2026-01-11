/** biome-ignore-all lint/correctness/useExhaustiveDependencies: useEffect dependencies */
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
import { environment } from '../../../globals';
import { FilterLogicalOperator, IEntity, IFilterOfField } from '../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { CameraFocusType } from '../../../interfaces/location';
import { getEntitiesWithDirectConnections } from '../../../services/entitiesService';
import { useDarkModeStore } from '../../../stores/darkMode';

const { minSearchLength, maxNumberOfSearchResults } = environment.map;

type Props = {
    moveToEntityLocations: (entity: IEntity[]) => void;
    entityTemplateMap: IEntityTemplateMap;
    darkMode: boolean;
    clearAutocompleteSearch: () => void;
    filters: {
        value: { autoSearch: string; listFields: Record<string, IFilterOfField['$in']>; dirty: boolean };
        set: React.Dispatch<React.SetStateAction<{ autoSearch: string; listFields: Record<string, IFilterOfField['$in']>; dirty: boolean }>>;
    };
    sourceTemplate?: IMongoEntityTemplatePopulated;
    isSearchShape?: boolean;
    applyFilterWithShapeSearch: (autoSearch: string, listFields: Record<string, IFilterOfField['$in']>) => void;
    setCameraFocus: (value: React.SetStateAction<CameraFocusType | null>) => void;
    numOfViewedEntitiesText?: string;
};

const MapFilters = ({
    moveToEntityLocations,
    entityTemplateMap,
    clearAutocompleteSearch,
    filters: {
        value: { autoSearch, listFields, dirty },
        set: setFilters,
    },
    sourceTemplate,
    isSearchShape,
    applyFilterWithShapeSearch,
    setCameraFocus,
    numOfViewedEntitiesText,
}: Props) => {
    const theme = useTheme();
    const [openFilter, setOpenFilter] = useState<boolean>(false);

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const templatesWithLocationField = Array.from(entityTemplateMap.values()).filter((key) =>
        Object.values(key.properties.properties).some((obj) => obj.format === 'location'),
    );

    const sourceListsFields = Object.entries(sourceTemplate?.properties.properties ?? {})
        .filter(([_, prop]) => prop.enum || prop.items?.enum)
        .map(([key, prop]) => ({
            name: key,
            ...prop,
        }));

    const templates = Object.fromEntries(
        templatesWithLocationField.map(({ _id: templateId }) => {
            const filter =
                templateId === sourceTemplate?._id && Object.keys(listFields).length
                    ? {
                          [FilterLogicalOperator.AND]: Object.entries(listFields).map(([field, values]) => ({
                              [field]: { $in: values },
                          })),
                      }
                    : undefined;

            return [templateId, filter ? { filter } : {}] as const;
        }),
    );

    useEffect(() => {
        const noFilters = autoSearch.length < 2 && !Object.keys(listFields).length;

        if (noFilters) {
            if (isSearchShape) applyFilterWithShapeSearch('', {});
            else clearAutocompleteSearch();
        }
    }, [autoSearch, listFields]);

    const { refetch } = useQuery(
        ['searchEntitiesOfTemplates', autoSearch],
        async () => {
            if (!Object.keys(templatesWithLocationField).length) return { count: 0, entities: [] };

            return getEntitiesWithDirectConnections({
                skip: 0,
                limit: maxNumberOfSearchResults + 1,
                textSearch: autoSearch,
                templates,
            });
        },
        {
            enabled: false,
            onSuccess: (data) => {
                if (!data.count) toast.warn(i18next.t('noSearchResults'));
                if (data.count > maxNumberOfSearchResults) toast.warn(i18next.t('location.tooManyResults'));
                else moveToEntityLocations(data.entities.map((entity) => entity.entity));
            },
            onError: () => {
                toast.error(i18next.t('templateEntitiesAutocomplete.failedToSearchEntities'));
            },
        },
    );

    const canSearch = () => autoSearch.length >= minSearchLength || Object.entries(listFields).length > 0;

    const handleSearch = () => {
        setFilters((prev) => ({ ...prev, dirty: false }));

        setCameraFocus(CameraFocusType.Search);
        isSearchShape ? applyFilterWithShapeSearch(autoSearch, listFields) : refetch();
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
                            disabled={!Object.entries(listFields).length && !autoSearch.length}
                            onClick={() => {
                                clearAutocompleteSearch();
                                const clearedFilters = { autoSearch: '', listFields: {}, dirty: false };

                                setFilters(clearedFilters);
                                if (isSearchShape) applyFilterWithShapeSearch('', {});
                            }}
                        >
                            {i18next.t('location.clearFilter')}
                        </Button>
                    </Grid>
                    <Divider />

                    <SearchInput
                        value={autoSearch}
                        showBorder
                        placeholder={i18next.t('globalSearch.searchInPage')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (canSearch()) handleSearch();
                                e.preventDefault();
                            }
                        }}
                        onChange={(newSearchValue: string) =>
                            setFilters((prev) => ({
                                ...prev,
                                autoSearch: newSearchValue,
                                listFields: !newSearchValue.length ? {} : prev.listFields,
                                dirty: true,
                            }))
                        }
                    />

                    <Divider />
                    <Box maxHeight={350} overflow="auto" display="flex" flexDirection="column" gap={2} paddingTop={1}>
                        {!!sourceListsFields.length &&
                            sourceListsFields.map((field, index) => (
                                <Autocomplete
                                    key={`${field.name}-${index}`}
                                    multiple
                                    options={field.enum ?? field.items?.enum ?? []}
                                    disabled={autoSearch.length < minSearchLength && !isSearchShape}
                                    onChange={(_e, newValue) => {
                                        setFilters((prev) => {
                                            const newListFields = { ...prev.listFields };

                                            if (!newValue.length) delete newListFields[field.name];
                                            else newListFields[field.name] = newValue;

                                            return {
                                                ...prev,
                                                listFields: newListFields,
                                                dirty: true,
                                            };
                                        });
                                    }}
                                    value={listFields[field.name] ?? []}
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
                        disabled={!canSearch() || !dirty}
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
