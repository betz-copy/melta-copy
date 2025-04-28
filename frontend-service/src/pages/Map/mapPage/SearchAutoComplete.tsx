/* eslint-disable no-param-reassign */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Autocomplete, Grid, TextField, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import { useInfiniteQuery } from 'react-query';
import { toast } from 'react-toastify';
import { _debounce } from '@ag-grid-community/core';
import { InfoOutlined } from '@mui/icons-material';
import {
    IMongoEntityTemplatePopulated,
    IEntity,
    IEntitySingleProperty,
    ISearchFilter,
    IMongoRelationshipTemplate,
} from '@microservices/shared-interfaces';
import { getEntitiesWithDirectConnections } from '../../../services/entitiesService';
import { MeltaTooltip } from '../../../common/MeltaTooltip';
import { EntityPropertiesInternal } from '../../../common/EntityProperties';
import { useDarkModeStore } from '../../../stores/darkMode';

type props = {
    selectedTemplates: IMongoEntityTemplatePopulated[];
    handleEntityClick: (entity: IEntity) => void;
};

const SearchAutoComplete = ({ selectedTemplates, handleEntityClick }: props) => {
    const theme = useTheme();
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const [inputValue, setInputValue] = useState('');
    const [searchResults, setSearchResults] = useState<IEntity[]>([]);
    const [templatesObject, setTemplatesObject] = useState<{
        [templateId: string]: {
            filter?: ISearchFilter;
            showRelationships: boolean | Array<IMongoRelationshipTemplate['_id']>;
        };
    }>({});

    useEffect(() => {
        const updatedTemplatesObject = selectedTemplates.map(({ _id }) => _id).reduce((acc, template) => ({ ...acc, [template]: {} }), {});
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
                sort: [],
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
        if (!inputValue && Object.keys(templatesObject).length > 0) {
            setInputValue(' ');
        }
    }, [templatesObject, inputValue]);

    useEffect(() => {
        if (data) {
            setSearchResults(data.pages.flatMap(({ entities }) => entities.map(({ entity }) => entity)));
        }
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
            onInputChange={(event, _newInputValue, reason) => {
                if (reason === 'reset') {
                    setInputValue('');
                } else debouncedSearch((event.target as HTMLInputElement).value);
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    sx={{
                        backgroundColor: theme.palette.background.default,
                        width: 400,
                        borderRadius: '10px',
                    }}
                    label={i18next.t('globalSearch.searchInPage')}
                    size="small"
                    variant="outlined"
                />
            )}
            renderOption={(props, option) => {
                const template = selectedTemplates.find(({ _id }) => _id === option.templateId);

                // TODO add template name below every item and take care of template not wxist
                if (!template) return null;

                const locationTemplateProperties = Object.entries(template.properties.properties)
                    .filter(([_key, value]) => value.format === 'location')
                    .reduce(
                        (acc, [key, value]) => {
                            acc[key] = value;
                            return acc;
                        },
                        {} as { [x: string]: IEntitySingleProperty },
                    );

                const locationProperties = Object.entries(option.properties)
                    .filter(([key, _value]) => key in locationTemplateProperties)
                    .reduce(
                        (acc, [key, value]) => {
                            acc[key] = value;
                            return acc;
                        },
                        {} as { [x: string]: any },
                    );

                return (
                    <li {...props} ref={props['data-option-index'] === searchResults.length - 1 ? lastElementRef : null}>
                        <Grid container direction="row" alignItems="center">
                            <Grid item container direction="column" onClick={() => handleEntityClick(option)}>
                                <Grid item container alignSelf="center" direction="row" spacing={1}>
                                    <Grid item>
                                        <MeltaTooltip
                                            title={
                                                template.propertiesPreview.length === 0 ? (
                                                    i18next.t('templateEntitiesAutocomplete.noPreviewFields')
                                                ) : (
                                                    <EntityPropertiesInternal
                                                        properties={option.properties}
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
                                    <Grid item>
                                        <Typography fontWeight={600}>{template.displayName}</Typography>
                                    </Grid>
                                </Grid>
                                <Grid item container direction="column" spacing={1}>
                                    {Object.entries(locationProperties).map(([key, value]) => (
                                        <Grid key={key} container item alignItems="center" justifyContent="space-between" paddingX="10px">
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
                                                {locationTemplateProperties[key].title}:
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
