import { ExpandMore, InfoOutlined } from '@mui/icons-material';
import { Autocomplete, AutocompleteInputChangeReason, AutocompleteProps, Grid, TextField, Typography } from '@mui/material';
import i18next from 'i18next';
import _debounce from 'lodash.debounce';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useInfiniteQuery } from 'react-query';
import { toast } from 'react-toastify';
import { environment } from '../../globals';
import { IEntity, ISearchEntitiesOfTemplateBody } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { searchEntitiesOfTemplateClientSideRequest } from '../../services/clientSideService';
import { searchEntitiesOfTemplateRequest } from '../../services/entitiesService';
import { useClientSideUserStore } from '../../stores/clientSideUser';
import { locationConverterToString } from '../../utils/map/convert';
import { EntityPropertiesInternal } from '../EntityProperties';
import MeltaTooltip from '../MeltaDesigns/MeltaTooltip';
import RelationshipReferenceView from '../RelationshipReferenceView';
import { CoordinateSystem } from './JSONSchemaFormik/RjsfLocationWidget';

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
    relationFilters?: string;
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
    relationFilters,
}) => {
    const clientSideUserEntity = useClientSideUserStore((state) => state.clientSideUserEntity);

    const { cacheBlockSize } = environment.agGrid;

    const [inputValue, setInputValue] = useState<string>(displayValue || '');
    const [allEntities, setAllEntities] = useState<IEntity[]>([]);

    const parseAndAddDisabled = (filters: string) => {
        const jsonFilters = JSON.parse(filters);

        const disabledCondition = { disabled: { $eq: false } };

        if (jsonFilters.$and && Array.isArray(jsonFilters.$and)) {
            return {
                $and: [...jsonFilters.$and, disabledCondition],
            };
        }

        return {
            $and: [jsonFilters, disabledCondition],
        };
    };

    const searchFunction = (templateId: string, clientSideUserEntityId: string, searchBody: ISearchEntitiesOfTemplateBody) =>
        clientSideUserEntity?.properties?._id
            ? searchEntitiesOfTemplateClientSideRequest(templateId, clientSideUserEntityId, searchBody)
            : searchEntitiesOfTemplateRequest(templateId, searchBody);

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery(
        ['searchEntitiesOfTemplate', template._id, inputValue],
        ({ pageParam = 0 }) => {
            return searchFunction(template._id!, clientSideUserEntity?.properties?._id, {
                skip: pageParam * cacheBlockSize,
                limit: cacheBlockSize,
                filter: relationFilters ? parseAndAddDisabled(relationFilters) : { $and: { disabled: { $eq: false } } },
                textSearch: inputValue,
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

    const convertPropertyToString = (property: any): string | undefined => {
        if (typeof property === 'object') {
            if (property.location) {
                return property.coordinateSystem === CoordinateSystem.UTM
                    ? locationConverterToString(property.location, CoordinateSystem.WGS84, CoordinateSystem.UTM)
                    : property.location;
            }

            if (Array.isArray(property)) {
                try {
                    // user array
                    const parsedArray = property.map((prop) => {
                        if (prop?.fullName) {
                            return prop.fullName;
                        }

                        const parsed = JSON.parse(prop);

                        if (parsed.fullName) return parsed.fullName;

                        return prop;
                    });
                    return parsedArray.join(', ');
                } catch {
                    return property.join(', ');
                }
            }

            if (property.fullName && property.mail && property.hierarchy && property.id && property.jobTitle) {
                // user when editing entity
                return property.fullName;
            }

            return property.toString();
        }

        try {
            // user when creating entity from scratch
            const parsedUser = JSON.parse(property);

            return typeof parsedUser === 'object' ? parsedUser.fullName : parsedUser;
        } catch {
            return property;
        }
    };

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
            getOptionLabel={(option) => convertPropertyToString(option.properties[showField]) || option.properties._id.toString()}
            isOptionEqualToValue={(option, currValue) => option.properties._id === currValue.properties._id}
            filterOptions={(options) => options}
            popupIcon={<ExpandMore />}
            renderInput={(params) => {
                const relProperty = value?.properties[showField];

                return (
                    <TextField
                        {...params}
                        error={isError}
                        fullWidth
                        helperText={helperText}
                        label={String(label)}
                        InputProps={{
                            ...params.InputProps,
                            readOnly,
                            endAdornment: readOnly ? undefined : params.InputProps.endAdornment,
                            startAdornment: relProperty ? (
                                <RelationshipReferenceView entity={value} relatedTemplateId={value.templateId} relatedTemplateField={showField} />
                            ) : undefined,
                            inputProps: {
                                ...params.inputProps,
                                style: relProperty ? { display: 'none' } : {},
                            },
                        }}
                    />
                );
            }}
            renderOption={(props, option) => {
                const displayOptionValues = displayKeys.map((key) => {
                    const property = option.properties[key];

                    return convertPropertyToString(property);
                });

                return (
                    <li {...props} ref={props['data-option-index'] === allEntities.length - 1 ? lastElementRef : null}>
                        <Grid container justifyContent="space-between" direction="row" spacing={1} my={0.05}>
                            {displayOptionValues.map((displayOptionValue, index) => (
                                <Grid key={displayOptionValue} size={{ xs: 4 }} overflow="hidden">
                                    <MeltaTooltip placement="right" title={displayOptionValue}>
                                        <Typography color={index > 0 ? '#9398C2' : '#53566E'} overflow="hidden" fontSize="14px">
                                            {displayOptionValue}
                                        </Typography>
                                    </MeltaTooltip>
                                </Grid>
                            ))}
                            <Grid size={{ xs: 0 }}>
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
                                    <InfoOutlined sx={{ color: '#9398C2' }} />
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
