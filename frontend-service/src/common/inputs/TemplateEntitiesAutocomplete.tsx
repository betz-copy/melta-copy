import { Autocomplete, AutocompleteInputChangeReason, AutocompleteProps, Grid, TextField, Typography } from '@mui/material';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import _debounce from 'lodash.debounce';
import i18next from 'i18next';
import { InfoOutlined } from '@mui/icons-material';
import { MeltaTooltip } from '../MeltaTooltip';
import { IEntity } from '../../interfaces/entities';
import { searchEntitiesOfTemplateRequest } from '../../services/entitiesService';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
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
}) => {
    const [inputValue, setInputValue] = useState<string>(displayValue || '');
    const [page, setPage] = useState(0);
    const [allEntities, setAllEntities] = useState<IEntity[]>([]);

    const { data, refetch, isFetching } = useQuery(
        ['searchEntitiesOfTemplate', template._id, inputValue, page],
        async () =>
            await searchEntitiesOfTemplateRequest(template._id!, {
                skip: page * environment.agGrid.cacheBlockSize,
                limit: environment.agGrid.cacheBlockSize,
                filter: { $and: { disabled: { $eq: false } } },
                textSearch: inputValue,
            }),
        {
            onError: () => {
                toast.error(i18next.t('templateEntitiesAutocomplete.failedToSearchEntities'));
            },
            retry: false,
            keepPreviousData: true,
        },
    );

    useEffect(() => {
        if (data) {
            if (page === 0) {
                setAllEntities(data.entities.map((entity) => entity.entity));
            } else {
                setAllEntities((prev) => [...prev, ...data.entities.map((entity) => entity.entity)]);
            }
        }
    }, [data, page]);

    const handleInputChange = (_e: any, newValue: string, reason: AutocompleteInputChangeReason) => {
        setInputValue(newValue);
        onDisplayValueChange?.(_e, newValue, reason);
        if (reason === 'input' && newValue.length >= 2) {
            setPage(0);
            setAllEntities([]);
            refetch();
        }
    };

    const loadMore = useCallback(() => {
        if (!isFetching) {
            setPage((prevPage) => prevPage + 1);
        }
    }, [isFetching]);

    const observer = useRef<IntersectionObserver>();

    const lastElementRef = useCallback(
        (node) => {
            if (isFetching) return;
            if (observer.current) observer.current.disconnect();
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            });
            if (node) observer.current.observe(node);
        },
        [isFetching, loadMore],
    );

    const [additionalKey] = template.propertiesPreview ?? template.propertiesOrder;
    const displayKeys = [showField, additionalKey];

    return (
        <Autocomplete
            value={value}
            inputValue={inputValue}
            onChange={onChange}
            onInputChange={handleInputChange}
            disabled={disabled}
            onBlur={onBlur}
            options={allEntities}
            loading={isFetching}
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
                            <Grid item xs={4} overflow="hidden">
                                <MeltaTooltip placement="right" title={displayOptionValues[0]}>
                                    <Typography color="black" overflow="hidden">
                                        {displayOptionValues[0]}
                                    </Typography>
                                </MeltaTooltip>
                            </Grid>
                            <Grid item xs={4} overflow="hidden">
                                <MeltaTooltip placement="bottom" title={displayOptionValues[1]}>
                                    <Typography fontWeight="1" color="#166BD4" noWrap>
                                        {displayOptionValues[1]}
                                    </Typography>
                                </MeltaTooltip>
                            </Grid>
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
