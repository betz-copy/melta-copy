import { Add, ExpandMore, InfoOutlined } from '@mui/icons-material';
import { Autocomplete, AutocompleteInputChangeReason, AutocompleteProps, Box, TextField, Typography } from '@mui/material';
import i18next from 'i18next';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { environment } from '../../globals';
import { IChildTemplateMap, IChildTemplatePopulated } from '../../interfaces/childTemplates';
import { AndFilter, IEntity, IPropertyValue, ISearchEntitiesOfTemplateBody, ISearchFilter } from '../../interfaces/entities';
import { IEntitySingleProperty, IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IGetUnits } from '../../interfaces/units';
import { IWorkspace } from '../../interfaces/workspaces';
import { searchEntitiesOfTemplateClientSideRequest } from '../../services/clientSideService';
import { searchEntitiesOfTemplateRequest } from '../../services/entitiesService';
import { useClientSideUserStore } from '../../stores/clientSideUser';
import { UserState, useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import { locationConverterToString } from '../../utils/map/convert';
import { isWorkspaceAdmin } from '../../utils/permissions/instancePermissions';
import { EntityWizardValues } from '../dialogs/entity';
import { getDefaultFilterFromTemplate } from '../EntitiesPage/TemplateTablesView';
import { EntityPropertiesInternal } from '../EntityProperties';
import MeltaTooltip from '../MeltaDesigns/MeltaTooltip';
import RelationshipReferenceView from '../RelationshipReferenceView';
import { CoordinateSystem } from './JSONSchemaFormik/Widgets/RjsfLocationWidget';

const { fieldFilterPrefix, twinWalletId } = environment;

export const getChildTemplatesFilter = (
    childTemplatesOfRelatedTemplate: IChildTemplatePopulated[],
    workspace: IWorkspace,
    currentUser: UserState['user'],
    isChildTemplate?: boolean,
): ISearchFilter | undefined => {
    const currentUserKartoffelId = currentUser.kartoffelId;

    const childTemplatesFilters = childTemplatesOfRelatedTemplate
        .map((childTemplate) =>
            getDefaultFilterFromTemplate(
                childTemplate,
                true,
                currentUserKartoffelId,
                currentUser?.usersUnitsWithInheritance,
                isWorkspaceAdmin(currentUser?.permissions?.[workspace._id] ?? {}),
            ),
        )
        .filter((f): f is ISearchFilter => !!f);

    return !!childTemplatesFilters.length && isChildTemplate ? { $or: childTemplatesFilters } : undefined;
};

const TemplateEntitiesAutocomplete: React.FC<{
    template: IMongoEntityTemplatePopulated | undefined;
    showField: string;
    value: IEntity | null;
    currentEntity: EntityWizardValues['properties'];
    noRelationPermission: boolean;
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
    required?: boolean;
    isChildTemplate?: boolean;
    isSourceTransferKey?: boolean;
    isTwinTransfer?: boolean;
}> = ({
    template,
    showField,
    value,
    currentEntity,
    noRelationPermission,
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
    required,
    isChildTemplate,
    isSourceTransferKey,
    isTwinTransfer,
}) => {
    const currentUser = useUserStore((state) => state.user);
    const workspace = useWorkspaceStore((state) => state.workspace);

    const clientSideUserEntity = useClientSideUserStore((state) => state.clientSideUserEntity);

    const { cacheBlockSize } = environment.agGrid;

    const [inputValue, setInputValue] = useState<string>(displayValue || '');
    const [allEntities, setAllEntities] = useState<IEntity[]>([]);
    const queryClient = useQueryClient();

    const templates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildTemplates')!;
    const childTemplatesOfRelatedTemplate = Array.from(childTemplates.values()).filter((child) => child.parentTemplate._id === template?._id);

    const units = queryClient.getQueryData<IGetUnits>('getUnits')!;

    const { metadata } = useWorkspaceStore((state) => state.workspace);

    const getDependentFieldsValues = (
        filters?: string,
        currentEntity?: EntityWizardValues['properties'],
    ): { dependentFields: Record<string, IPropertyValue>; newFilters: ISearchFilter[] } => {
        const newFilters: ISearchFilter[] = [];
        const dependentFields: Record<string, IPropertyValue> = {};

        if (!filters) return { dependentFields, newFilters };

        const parsedFilters = JSON.parse(filters);
        const andFilters = Array.isArray(parsedFilters.$and) ? parsedFilters.$and : [parsedFilters];

        for (const filter of andFilters) {
            const newFilter: Record<string, IPropertyValue> = {};

            for (const key in filter) {
                const condition = filter[key];
                for (const op in condition) {
                    const val = condition[op];
                    const newCondition: Record<string, IPropertyValue> = {};

                    if (typeof val === 'string' && val.startsWith(fieldFilterPrefix)) {
                        const fieldName = val.replace(fieldFilterPrefix, '');
                        dependentFields[fieldName] = currentEntity?.[fieldName];
                        newCondition[op] = currentEntity?.[fieldName];
                    } else newCondition[op] = val;

                    newFilter[key] = newCondition;
                }
            }
            newFilters.push(newFilter as AndFilter);
        }
        return { dependentFields, newFilters };
    };

    const { dependentFields } = getDependentFieldsValues(relationFilters, currentEntity);

    const parseAndAddDisabled = (filters: string | undefined): ISearchFilter => {
        const disabledCondition: ISearchFilter = { $and: { disabled: { $eq: false } } };
        const childTemplatesFilter = getChildTemplatesFilter(childTemplatesOfRelatedTemplate, workspace, currentUser, isChildTemplate);

        const filtersArray = getDependentFieldsValues(filters, currentEntity).newFilters;

        if (childTemplatesFilter) filtersArray.push(childTemplatesFilter);
        filtersArray.push(disabledCondition);

        return { $and: filtersArray };
    };

    const searchFunction = (templateId: string, clientSideUserEntityId: string, searchBody: ISearchEntitiesOfTemplateBody) =>
        clientSideUserEntity?.properties?._id
            ? searchEntitiesOfTemplateClientSideRequest(templateId, clientSideUserEntityId, searchBody)
            : searchEntitiesOfTemplateRequest(templateId, {
                  ...searchBody,
                  childTemplateIds: isChildTemplate ? childTemplatesOfRelatedTemplate.map((childTemplate) => childTemplate._id) : undefined,
              });

    const emptyDependentFields = Object.entries(dependentFields)
        .filter(([_, value]) => value === undefined || value === null)
        .map(([key]) => template?.properties.properties[key].title);

    const isDisabled = useMemo(() => disabled || !!emptyDependentFields.length, [disabled, emptyDependentFields]);

    const debouncedSearch = useCallback(
        debounce((value: string) => {
            if (emptyDependentFields.length) setInputValue(value);
        }, 1000),
        [],
    );

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery(
        ['searchEntitiesOfTemplate', template?._id, inputValue],
        ({ pageParam = 0 }) => {
            return searchFunction(template!._id, clientSideUserEntity?.properties?._id, {
                skip: pageParam * cacheBlockSize,
                limit: cacheBlockSize,
                filter: parseAndAddDisabled(relationFilters),
                textSearch: inputValue,
            });
        },
        {
            enabled: !noRelationPermission && !isDisabled,
            getNextPageParam: (lastPage, pages) => {
                if (lastPage.entities.length < cacheBlockSize) return undefined;
                return pages.length;
            },
            onError: () => {
                toast.error(i18next.t('templateEntitiesAutocomplete.failedToSearchEntities'));
            },
        },
    );

    const accountBalanceKey = template
        ? Object.keys(template.properties.properties).find((key) => template.properties.properties[key]?.accountBalance === true)
        : undefined;

    useEffect(() => {
        if (data) setAllEntities(data.pages.flatMap(({ entities }) => entities.map(({ entity }) => entity)));
    }, [data]);

    const handleInputChange = (_e: React.SyntheticEvent, newValue: string, reason: AutocompleteInputChangeReason) => {
        setInputValue(newValue);
        onDisplayValueChange?.(_e, newValue, reason);
        if (reason === 'input') debouncedSearch(newValue);
    };

    const loadMore = useCallback(() => {
        if (!isDisabled && hasNextPage && !isFetchingNextPage) fetchNextPage();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, isDisabled]);

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

    const displayKeys: string[] = [showField];

    const preview = template?.propertiesPreview ?? [];
    const order = template?.propertiesOrder ?? [];

    const orderedProperties = [...preview, ...order.filter((prop) => !preview.includes(prop))];

    orderedProperties
        .filter((prop) => prop !== showField && !displayKeys.includes(prop))
        .slice(0, metadata.numOfRelationshipFieldsToShow - 1)
        .forEach((prop) => {
            displayKeys.push(prop);
        });

    const convertPropertyToString = (value: IPropertyValue, property: IEntitySingleProperty | undefined): string | undefined => {
        if (property?.format === 'unitField') return units.find((unit) => unit._id === value)?.name ?? '';

        if (typeof value === 'object') {
            if (value.location) {
                return value.coordinateSystem === CoordinateSystem.UTM
                    ? locationConverterToString(value.location, CoordinateSystem.WGS84, CoordinateSystem.UTM)
                    : value.location;
            }

            if (Array.isArray(value)) {
                try {
                    const parsedArray = value.map((prop) => {
                        if (prop?.fullName) return prop.fullName;

                        const parsed = JSON.parse(prop);

                        if (parsed.fullName) return parsed.fullName;

                        return prop;
                    });
                    return parsedArray.join(', ');
                } catch {
                    return value.join(', ');
                }
            }

            if (value.fullName && value.mail && value.hierarchy && value.id && value.jobTitle) {
                return value.fullName;
            }

            return value.toString();
        }

        try {
            const parsedUser = JSON.parse(value);

            return typeof parsedUser === 'object' ? parsedUser.fullName : parsedUser;
        } catch {
            return value;
        }
    };

    const twinEntity: IEntity = {
        templateId: template?._id ?? '',
        properties: { _id: twinWalletId, createdAt: new Date().toString(), updatedAt: new Date().toString(), disabled: false },
    };
    const getTemplate = (option: IEntity) => {
        return templates.get(option.templateId) || childTemplates.get(option.childTemplateId ?? '');
    };

    return (
        <Autocomplete
            value={value}
            inputValue={inputValue}
            onChange={onChange}
            onInputChange={handleInputChange}
            disabled={isDisabled}
            onBlur={onBlur}
            style={style}
            options={isTwinTransfer ? [twinEntity, ...allEntities] : allEntities}
            loading={isLoading || isFetchingNextPage}
            loadingText={i18next.t('templateEntitiesAutocomplete.loading')}
            noOptionsText={i18next.t(`templateEntitiesAutocomplete.no${noRelationPermission ? 'WritePermissions' : 'Options'}`)}
            getOptionDisabled={(option) => !!(accountBalanceKey && isSourceTransferKey && (option.properties?.[accountBalanceKey] || 0) <= 0)}
            getOptionLabel={(option) =>
                convertPropertyToString(option.properties[showField], getTemplate(option)?.properties.properties?.[showField]) ||
                option.properties._id.toString()
            }
            isOptionEqualToValue={(option, currValue) => option.properties._id === currValue.properties._id}
            filterOptions={(options) => options}
            popupIcon={<ExpandMore />}
            renderInput={(params) => {
                const relProperty = value?.properties[showField];
                const isTwinWallet = value?.properties._id === twinWalletId;

                return (
                    <TextField
                        {...params}
                        required={required}
                        error={isError}
                        fullWidth
                        helperText={
                            emptyDependentFields.length
                                ? i18next.t(`templateEntitiesAutocomplete.dependentField${emptyDependentFields.length > 1 ? 's' : ''}Required`, {
                                      field: emptyDependentFields.length > 1 ? emptyDependentFields.join(', ') : emptyDependentFields[0],
                                  })
                                : helperText
                        }
                        label={String(label)}
                        sx={{
                            opacity: isTwinWallet ? 0.6 : 1,
                            pointerEvents: 'auto',
                            '& .MuiInputBase-root.Mui-readOnly': {
                                backgroundColor: '#F3F5F9',
                            },
                            '& .MuiInputLabel-root.Mui-readOnly': {
                                color: '#BBBED8',
                            },
                        }}
                        slotProps={{
                            input: {
                                ...params.InputProps,
                                readOnly: isTwinWallet || readOnly,
                                endAdornment: readOnly ? undefined : params.InputProps.endAdornment,
                                startAdornment: relProperty ? (
                                    <RelationshipReferenceView entity={value} relatedTemplateId={value.templateId} relatedTemplateField={showField} />
                                ) : isTwinWallet ? (
                                    <Typography>{i18next.t('templateEntitiesAutocomplete.newDestWalletTwinEntity')}</Typography>
                                ) : undefined,
                                inputProps: {
                                    ...params.inputProps,
                                    style: relProperty || isTwinWallet ? { display: 'none' } : {},
                                },
                            },
                        }}
                    />
                );
            }}
            renderOption={(props, option) => {
                const template = getTemplate(option);

                const displayOptionValues = displayKeys.map((key) => {
                    const property = option.properties[key];
                    return convertPropertyToString(property, template?.properties.properties?.[key]);
                });

                return (
                    <li
                        {...props}
                        ref={props['data-option-index'] === allEntities.length - 1 ? lastElementRef : null}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
                    >
                        {option.properties._id === twinWalletId ? (
                            <Box display="flex" alignItems="center" width="100%">
                                <Add color="primary" />
                                <Typography
                                    color="#293271"
                                    fontSize="14px"
                                    sx={{
                                        textOverflow: 'ellipsis',
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap',
                                        maxWidth: '100%',
                                        marginLeft: '14px',
                                    }}
                                >
                                    {i18next.t('templateEntitiesAutocomplete.newDestWalletTwinEntity')}
                                </Typography>
                            </Box>
                        ) : (
                            <>
                                {displayOptionValues.map((displayOptionValue, index) => (
                                    <MeltaTooltip
                                        // biome-ignore lint/suspicious/noArrayIndexKey: lol
                                        key={`${displayOptionValue}${index}`}
                                        placement="top"
                                        title={template?.properties.properties[displayKeys[index]].title ?? ''}
                                    >
                                        <Typography
                                            color="#53566E"
                                            fontSize="14px"
                                            style={{
                                                textOverflow: 'ellipsis',
                                                overflow: 'hidden',
                                                maxWidth: 100,
                                            }}
                                        >
                                            {displayOptionValue}
                                        </Typography>
                                    </MeltaTooltip>
                                ))}
                                <MeltaTooltip
                                    title={
                                        !template || template?.propertiesPreview.length === 0 ? (
                                            i18next.t('templateEntitiesAutocomplete.noPreviewFields')
                                        ) : (
                                            <EntityPropertiesInternal
                                                properties={option.properties}
                                                entityTemplate={template}
                                                coloredFields={option.coloredFields}
                                                showPreviewPropertiesOnly
                                                mode="white"
                                                textWrap
                                            />
                                        )
                                    }
                                >
                                    <InfoOutlined sx={{ color: '#9398C2', marginLeft: 'auto' }} />
                                </MeltaTooltip>
                            </>
                        )}
                    </li>
                );
            }}
            size={size}
        />
    );
};

export default TemplateEntitiesAutocomplete;
