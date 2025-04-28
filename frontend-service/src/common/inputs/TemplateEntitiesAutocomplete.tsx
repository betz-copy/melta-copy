import { Autocomplete, AutocompleteInputChangeReason, AutocompleteProps, Grid, TextField, Typography } from '@mui/material';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useInfiniteQuery } from 'react-query';
import { toast } from 'react-toastify';
import _debounce from 'lodash.debounce';
import i18next from 'i18next';
import { InfoOutlined } from '@mui/icons-material';
import { IEntity, IMongoEntityTemplatePopulated } from '@microservices/shared-interfaces';
import { MeltaTooltip } from '../MeltaTooltip';
import { searchEntitiesOfTemplateRequest } from '../../services/entitiesService';
import { EntityPropertiesInternal } from '../EntityProperties';
import RelationshipReferenceView from '../RelationshipReferenceView';
import { environment } from '../../globals';

const TemplateEntitiesAutocomplete: React.FC<{
    template: IMongoEntityTemplatePopulated;
    showField: string;
    value: IEntity | null;
    displayValue?: string;
    onChange: AutocompleteProps<IEntity, undefined, undefined, undefined>['onChange'];
    onDisplayValueChange?: AutocompleteProps<IEntity, undefined, undefined, undefined>['onInputChange'];
    onBlur?: AutocompleteProps<IEntity, undefined, undefined, undefined>['onBlur'];
    isOptionDisabled?: AutocompleteProps<IEntity, undefined, undefined, undefined>['getOptionDisabled'];
    disabled?: boolean;
    readOnly?: boolean;
    label?: string;
    isError: boolean;
    helperText?: string;
    size?: 'small' | 'medium';
    style?: React.CSSProperties;
}> = ({
    template,
    showField,
    value,
    displayValue,
    onChange,
    onDisplayValueChange,
    onBlur,
    disabled = false,
    readOnly = false,
    label = i18next.t('templateEntitiesAutocomplete.label'),
    isError,
    helperText,
    size,
    style,
}) => {
    const { cacheBlockSize } = environment.agGrid;

    const [inputValue, setInputValue] = useState<string>(displayValue || '');
    const [allEntities, setAllEntities] = useState<IEntity[]>([]);

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery(
        ['searchEntitiesOfTemplate', template._id, inputValue],
        ({ pageParam = 0 }) => {
            return searchEntitiesOfTemplateRequest(template._id!, {
                skip: pageParam * cacheBlockSize,
                limit: cacheBlockSize,
                filter: { $and: { disabled: { $eq: false } } },
                textSearch: inputValue,
                showRelationships: false,
                sort: [],
            });
        },
        {
            getNextPageParam: (lastPage, pages) => {
                if (lastPage.entities.length < cacheBlockSize) return undefined;
                return pages.length;
            },
            onError: () => {
                toast.error(i18next.t('templateEntitiesAutocomplete.failedToSearchEntities'));
            },
        },
    );

    useEffect(() => {
        if (data) {
            // eslint-disable-next-line @typescript-eslint/no-shadow
            setAllEntities(data.pages.flatMap((page) => page.entities.map((entity) => entity.entity)));
        }
    }, [data]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSearch = useCallback(
        _debounce((debounedValue: string) => {
            setInputValue(debounedValue);
        }, 300),
        [],
    );

    const handleInputChange = (_e: any, newValue: string, reason: AutocompleteInputChangeReason) => {
        setInputValue(newValue);
        onDisplayValueChange?.(_e, newValue, reason);
        if (reason === 'input' && newValue.length >= 2) {
            debouncedSearch(newValue);
        }
    };

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

    const displayKeys = [
        showField,
        (template.propertiesPreview[0] === showField
            ? (template.propertiesPreview[1] ?? template.propertiesOrder[0])
            : template.propertiesPreview[0]) ?? template.propertiesOrder[0],
    ];

    return (
        <Autocomplete
            value={value}
            inputValue={inputValue}
            onChange={onChange}
            onInputChange={handleInputChange}
            disabled={disabled}
            onBlur={onBlur}
            style={style}
            options={allEntities}
            loading={isLoading || isFetchingNextPage}
            loadingText={i18next.t('templateEntitiesAutocomplete.loading')}
            noOptionsText={i18next.t('templateEntitiesAutocomplete.noOptions')}
            getOptionLabel={(option) => option.properties[showField].toString() || option.properties._id.toString()}
            isOptionEqualToValue={(option, currValue) => option.properties._id === currValue.properties._id}
            filterOptions={(options) => options}
            renderInput={(params) => (
                <TextField
                    {...params}
                    error={isError}
                    fullWidth
                    helperText={helperText}
                    label={label}
                    InputProps={{ ...params.InputProps, readOnly, endAdornment: readOnly ? undefined : params.InputProps.endAdornment }}
                />
            )}
            renderOption={(props, option) => {
                const displayOptionValues = displayKeys.map((key) => {
                    const property = option.properties[key];
                    const templateProperty = template.properties.properties[key];

                    return typeof property === 'object' ? (
                        <RelationshipReferenceView
                            key={key}
                            entity={property}
                            relatedTemplateId={property.templateId}
                            relatedTemplateField={templateProperty.relationshipReference!.relatedTemplateField}
                        />
                    ) : (
                        property
                    );
                });

                return (
                    <li {...props} ref={props['data-option-index'] === allEntities.length - 1 ? lastElementRef : null}>
                        <Grid container justifyContent="space-between" direction="row" spacing={1}>
                            {displayOptionValues.map((displayOptionValue, index) => (
                                <Grid item key={displayOptionValue} xs={4} overflow="hidden">
                                    <MeltaTooltip placement="right" title={displayOptionValue}>
                                        <Typography color={index > 0 ? '#166BD4' : 'black'} overflow="hidden">
                                            {displayOptionValue}
                                        </Typography>
                                    </MeltaTooltip>
                                </Grid>
                            ))}
                            <Grid item xs={0}>
                                <MeltaTooltip
                                    title={
                                        template.propertiesPreview.length === 0 ? (
                                            i18next.t('templateEntitiesAutocomplete.noPreviewFields')
                                        ) : (
                                            <EntityPropertiesInternal
                                                properties={option.properties}
                                                entityTemplate={template}
                                                showPreviewPropertiesOnly
                                                mode="white"
                                                textWrap
                                            />
                                        )
                                    }
                                >
                                    <InfoOutlined sx={{ color: '#166BD4' }} />
                                </MeltaTooltip>
                            </Grid>
                        </Grid>
                    </li>
                );
            }}
            size={size}
        />
    );
};

export default TemplateEntitiesAutocomplete;
