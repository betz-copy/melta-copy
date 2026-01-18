/** biome-ignore-all lint/correctness/useExhaustiveDependencies: useEffect dependencies */
import { FilterList, Search } from '@mui/icons-material';
import { Autocomplete, Box, Button, Divider, Grid, InputAdornment, TextField, Typography, useTheme } from '@mui/material';
import { FilterLogicalOperator, IEntity, IFilterOfField } from '@packages/entity';
import { IEntityTemplateMap, IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import i18next from 'i18next';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import { ColoredEnumChip } from '../../../common/ColoredEnumChip';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import { environment } from '../../../globals';
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
        value: { autoSearch: string; listFields: Record<string, IFilterOfField['$in']> };
        set: React.Dispatch<React.SetStateAction<{ autoSearch: string; listFields: Record<string, IFilterOfField['$in']> }>>;
    };
    sourceTemplate?: IMongoEntityTemplateWithConstraintsPopulated;
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
        value: { autoSearch, listFields },
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
    const [debouncedSearchValue, setDebouncedSearchValue] = useState<string>(autoSearch ?? '');

    useEffect(() => setDebouncedSearchValue(autoSearch), [autoSearch]);

    const debouncedSetFilter = useCallback(
        debounce((newValue: string) => setFilters((prev) => ({ ...prev, autoSearch: newValue })), 300),
        [setFilters],
    );

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;

        setDebouncedSearchValue(value);
        debouncedSetFilter(value);
    };

    useEffect(() => {
        return () => debouncedSetFilter.cancel();
    }, [debouncedSetFilter]);

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

            return [templateId, filter ? { filter, showRelationships: false } : { showRelationships: false }] as const;
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

    const canSearch = useMemo(() => {
        return autoSearch.length >= minSearchLength || Object.entries(listFields).length > 0;
    }, [autoSearch, listFields]);

    useEffect(() => {
        if (!canSearch) return;

        setCameraFocus(CameraFocusType.Search);

        isSearchShape ? applyFilterWithShapeSearch(autoSearch, listFields) : refetch();
    }, [listFields, autoSearch, minSearchLength, isSearchShape]);

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
                                const clearedFilters = { autoSearch: '', listFields: {} };

                                setFilters(clearedFilters);
                                if (isSearchShape) applyFilterWithShapeSearch('', {});
                            }}
                        >
                            {i18next.t('location.clearFilter')}
                        </Button>
                    </Grid>
                    <Divider />

                    <TextField
                        value={debouncedSearchValue}
                        onChange={handleSearchChange}
                        placeholder={`${i18next.t('globalSearch.searchInPage')}  ${i18next.t('location.minCharsToStartSearch')}`}
                        fullWidth
                        size="small"
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignContent: 'center',
                            borderRadius: '7px',
                            height: '34px',
                            width: '231px',
                            ...(darkMode
                                ? {}
                                : {
                                      backgroundColor: 'white',
                                      '& .MuiOutlinedInput-notchedOutline': { border: '' },
                                  }),
                        }}
                        slotProps={{
                            input: {
                                style: {
                                    borderRadius: '7px',
                                    color: theme.palette.primary.main,
                                    fontFamily: 'Rubik',
                                    fontSize: '12px',
                                    textAlign: 'right',
                                },
                                endAdornment: (
                                    <InputAdornment position="end" sx={{ gap: '6px' }}>
                                        <Divider
                                            orientation="vertical"
                                            sx={{
                                                width: '1px',
                                                height: '20px',
                                                borderRadius: '1.5px',
                                                backgroundColor: theme.palette.primary.main,
                                            }}
                                        />

                                        <Search fontSize="small" />
                                    </InputAdornment>
                                ),
                                startAdornment: <InputAdornment position="start" />,
                            },
                        }}
                    />

                    <Divider />
                    <Box maxHeight={350} overflow="auto" display="flex" flexDirection="column" gap={2} paddingTop={1}>
                        {!!sourceListsFields.length &&
                            sourceListsFields.map((field, index) => (
                                <Autocomplete
                                    key={`${field.name}-${index}`}
                                    multiple
                                    options={field.enum ?? field.items?.enum ?? []}
                                    onChange={(_e, newValue) => {
                                        setFilters((prev) => {
                                            const newListFields = { ...prev.listFields };

                                            if (!newValue.length) delete newListFields[field.name];
                                            else newListFields[field.name] = newValue;

                                            return {
                                                ...prev,
                                                listFields: newListFields,
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
                </Grid>
            )}
        </Grid>
    );
};

export default MapFilters;
