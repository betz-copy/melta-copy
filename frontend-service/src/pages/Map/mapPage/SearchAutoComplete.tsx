import { _debounce } from '@ag-grid-community/core';
import { InfoOutlined } from '@mui/icons-material';
import { Autocomplete, Grid, TextField, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useInfiniteQuery } from 'react-query';
import { toast } from 'react-toastify';
import { EntityPropertiesInternal } from '../../../common/EntityProperties';
import MeltaTooltip from '../../../common/MeltaDesigns/MeltaTooltip';
import { IEntity } from '../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { getEntitiesWithDirectConnections } from '../../../services/entitiesService';
import { useDarkModeStore } from '../../../stores/darkMode';
import { getLocationProperties } from '../../../utils/map';

interface LocationAutoCompleteOptionProps {
    title: string;
    value: string;
}

const LocationAutoCompleteOption: React.FC<LocationAutoCompleteOptionProps> = ({ title, value }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <Grid container alignItems="center" justifyContent="space-between" paddingX="10px">
            <Typography
                style={{
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textAlign: 'right',
                    flex: '1',
                    marginRight: '8px',
                }}
                fontSize="14px"
                color="#9398C2"
            >
                {title}:
            </Typography>
            <MeltaTooltip placement="bottom" title={value}>
                <Typography
                    style={{
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textAlign: 'left',
                        flex: '2',
                        maxWidth: '100%',
                    }}
                    fontSize="14px"
                    color={darkMode ? '#dcdde2' : '#53566E'}
                >
                    {value}
                </Typography>
            </MeltaTooltip>
        </Grid>
    );
};

type props = {
    selectedTemplates: IMongoEntityTemplatePopulated[];
    handleEntityClick: (entity: IEntity) => void;
    onClear: () => void;
};

const SearchAutoComplete = ({ selectedTemplates, handleEntityClick, onClear }: props) => {
    const theme = useTheme();

    const [inputValue, setInputValue] = useState('');
    const [searchResults, setSearchResults] = useState<IEntity[]>([]);
    const [templatesObject, setTemplatesObject] = useState<Record<string, object>>({});

    useEffect(() => {
        const updatedTemplatesObject: Record<string, any> = {};
        for (const { _id } of selectedTemplates) {
            updatedTemplatesObject[_id] = {};
        }
        setTemplatesObject(updatedTemplatesObject);
    }, [selectedTemplates]);

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery(
        ['searchEntitiesOfTemplates', inputValue],
        ({ pageParam = 0 }) => {
            if (Object.keys(templatesObject).length === 0) return { count: 0, entities: [] };
            return getEntitiesWithDirectConnections({
                skip: pageParam * 50,
                limit: 50,
                textSearch: inputValue,
                templates: templatesObject,
            });
        },
        {
            getNextPageParam: (lastPage, pages) => {
                if (lastPage.entities.length < 50) return undefined;
                return pages.length;
            },
            onError: () => {
                toast.error(i18next.t('templateEntitiesAutocomplete.failedToSearchEntities'));
            },
        },
    );

    useEffect(() => {
        if (!inputValue && Object.keys(templatesObject).length) setInputValue(' ');
    }, [templatesObject, inputValue]);

    useEffect(() => {
        if (data) setSearchResults(data.pages.flatMap(({ entities }) => entities.map(({ entity }) => entity)));
    }, [data]);

    const debouncedSearch = useCallback(
        _debounce((debounedValue: string) => {
            setInputValue(debounedValue);
        }, 300),
        [],
    );

    const loadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const observer = useRef<IntersectionObserver | null>(null);

    const lastElementRef = useCallback(
        (node) => {
            if (isLoading) return;
            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) loadMore();
            });
            if (node) observer.current.observe(node);
        },
        [isLoading, loadMore],
    );

    useEffect(() => {
        if (data)
            setSearchResults(
                data.pages
                    .flatMap(({ entities }) => entities.map(({ entity }) => entity))
                    .filter((entity) =>
                        Object.values(getLocationProperties(entity, selectedTemplates).locationProperties || {}).some((value) => value !== undefined),
                    ),
            );
    }, [data, selectedTemplates]);

    return (
        <Autocomplete
            options={searchResults}
            getOptionLabel={(option) => option.properties._id}
            loading={isLoading || isFetchingNextPage}
            loadingText={i18next.t('templateEntitiesAutocomplete.loading')}
            noOptionsText={i18next.t('templateEntitiesAutocomplete.noOptions')}
            isOptionEqualToValue={(option, currValue) => option.properties._id === currValue.properties._id}
            filterOptions={(options) => options}
            sx={{
                '.MuiAutocomplete-inputRoot': {
                    maxHeight: '34px',
                    boxShadow: '-2px 2px 6px 0px #1E27754D',
                },
                '& .MuiInputLabel-root': {
                    fontFamily: 'Rubik',
                    fontSize: '14px',
                },
            }}
            onInputChange={(_event, newInputValue, reason) => {
                if (reason === 'clear') {
                    setInputValue(' ');
                    onClear();
                } else debouncedSearch(newInputValue);
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    sx={{
                        backgroundColor: theme.palette.background.default,
                        borderRadius: '7px',
                        width: 400,
                    }}
                    placeholder={i18next.t('globalSearch.searchInPage')}
                    size="small"
                    variant="outlined"
                />
            )}
            onChange={(_event, newValue) => {
                if (newValue) handleEntityClick(newValue);
            }}
            renderOption={(props, option) => {
                const { template, locationTemplateProperties, locationProperties } = getLocationProperties(option, selectedTemplates);
                if (!template) return false;

                return (
                    <li {...props} ref={props['data-option-index'] === searchResults.length - 1 ? lastElementRef : null}>
                        <Grid container direction="row" alignItems="center">
                            <Grid container direction="column">
                                <Grid container alignSelf="center" direction="row" spacing={1}>
                                    <Grid>
                                        <MeltaTooltip
                                            title={
                                                template.propertiesPreview.length === 0 ? (
                                                    i18next.t('templateEntitiesAutocomplete.noPreviewFields')
                                                ) : (
                                                    <EntityPropertiesInternal
                                                        properties={option.properties}
                                                        coloredFields={option.coloredFields}
                                                        entityTemplate={template}
                                                        mode="white"
                                                        textWrap
                                                    />
                                                )
                                            }
                                        >
                                            <InfoOutlined sx={{ color: '#166BD4' }} />
                                        </MeltaTooltip>
                                    </Grid>
                                    <Grid>
                                        <Typography fontWeight={600}>{template.displayName}</Typography>
                                    </Grid>
                                </Grid>
                                <Grid container direction="column" spacing={1}>
                                    {template.mapSearchProperties
                                        ? template.mapSearchProperties.map((key) => (
                                              <LocationAutoCompleteOption
                                                  key={`${key}`}
                                                  title={template.properties.properties[key].title}
                                                  value={option.properties[key]}
                                              />
                                          ))
                                        : Object.entries(locationProperties).map(([key, value]) => (
                                              <LocationAutoCompleteOption
                                                  key={`${key}`}
                                                  title={locationTemplateProperties[key].title}
                                                  value={value}
                                              />
                                          ))}
                                </Grid>
                            </Grid>
                        </Grid>
                    </li>
                );
            }}
        />
    );
};

export default SearchAutoComplete;
