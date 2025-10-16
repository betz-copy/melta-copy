/* eslint-disable react/no-array-index-key */
/* eslint-disable no-param-reassign */
/* eslint-disable react-hooks/exhaustive-deps */
import { _debounce } from '@ag-grid-community/core';
import { InfoOutlined, Search } from '@mui/icons-material';
import { Autocomplete, Divider, Grid, InputAdornment, TextField, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useInfiniteQuery } from 'react-query';
import { toast } from 'react-toastify';
import { EntityPropertiesInternal } from '../../../common/EntityProperties';
import MeltaTooltip from '../../../common/MeltaDesigns/MeltaTooltip';
import { IEntity, IFilterOfField } from '../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { getEntitiesWithDirectConnections } from '../../../services/entitiesService';
import { useDarkModeStore } from '../../../stores/darkMode';
import { getLocationProperties } from '../../../utils/map';
import SearchInput from '../../../common/inputs/SearchInput';

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
    filters: { value: Record<string, IFilterOfField['$in']>; set: React.Dispatch<React.SetStateAction<Record<string, IFilterOfField['$in']>>> };
};

const SearchAutoComplete = ({ selectedTemplates, handleEntityClick, onClear }: props) => {
    const theme = useTheme();

    const [inputValue, setInputValue] = useState('');
    const [searchResults, setSearchResults] = useState<IEntity[]>([]);
    const [templatesObject, setTemplatesObject] = useState<Record<string, {}>>({});

    useEffect(() => {
        const updatedTemplatesObject = selectedTemplates
            .map(({ _id }) => _id)
            .reduce(
                (acc, template) => ({
                    ...acc,
                    [template]: {
                        //todo:only for source template
                        // filter:templatesPayload[sourceTemplateId] = {
                        //     filter: {
                        //         [FilterLogicalOperator.AND]: Object.entries(filters).map(([field, values]) => ({
                        //             [field]: { $in: values },
                        //         })),
                        //     },
                        // };
                    },
                }),
                {},
            );
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
    console.log({ data });

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
    }, [data]);

    return (
        <>
            <SearchInput showBorder placeholder="חיפוש בעמוד" onChange={(newSearchValue: string) => setInputValue(newSearchValue)} />
            {/* <Autocomplete
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
                        }}
                        placeholder={i18next.t('globalSearch.searchInPage')}
                        size="small"
                        variant="outlined"
                        // InputProps={{
                        //     endAdornment: (
                        //         <InputAdornment
                        //             position="end"
                        //             sx={{
                        //                 fontWeight: '400',
                        //                 // letterSpacing: '0em',
                        //                 lineHeight: '16px',
                        //                 gap: '10px',
                        //             }}
                        //         >
                        //             <Divider
                        //                 orientation="vertical"
                        //                 style={{
                        //                     width: '1px',
                        //                     height: '20px',
                        //                     borderRadius: '1.5px',
                        //                     backgroundColor: theme.palette.primary.main,
                        //                 }}
                        //             />
                        //             <Search fontSize="small" />{' '}
                        //         </InputAdornment>
                        //     ),
                        // }}
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
                                            ? template.mapSearchProperties.map((key, index) => (
                                                  <LocationAutoCompleteOption
                                                      key={`${key}-${index}`}
                                                      title={template.properties.properties[key].title}
                                                      value={option.properties[key]}
                                                  />
                                              ))
                                            : Object.entries(locationProperties).map(([key, value], index) => (
                                                  <LocationAutoCompleteOption
                                                      key={`${key}-${index}`}
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
            /> */}
        </>
    );
};

export default SearchAutoComplete;
