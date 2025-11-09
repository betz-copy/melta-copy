/** biome-ignore-all lint/suspicious/noExplicitAny: properties... */
/** biome-ignore-all lint/complexity/noUselessTypeConstraint: so the code looks normal after format */
import {
    ColDef,
    ICellRendererParams,
    IDateFilterParams,
    ISetFilterParams,
    ValueFormatterParams,
    ValueGetterFunc,
    ValueGetterParams,
} from '@ag-grid-community/core';
import { PriorityHigh } from '@mui/icons-material';
import { Box, Grid, Tooltip, tooltipClasses } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import OpenPreview from '../../common/FilePreview/OpenPreview';
import RelationshipReferenceView from '../../common/RelationshipReferenceView';
import UserAvatar, { IUserAvatarProps } from '../../common/UserAvatar';
import { IMongoChildTemplatePopulated } from '../../interfaces/childTemplates';
import {
    EntityData,
    IEntity,
    INotFoundRelationshipRefError,
    IRequiredConstraint,
    ISearchFilter,
    IUniqueConstraint,
    IUsersNotFoundError,
} from '../../interfaces/entities';
import { IEntitySingleProperty, IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IError, IFailedEntity, IValidationError } from '../../interfaces/excel';
import { ActionErrors } from '../../interfaces/ruleBreaches/actionMetadata';
import { ISemanticSearchResult } from '../../interfaces/semanticSearch';
import { IUser } from '../../interfaces/users';
import OpenMap from '../../pages/Map/OpenMap';
import { getDateWithoutTime, getLongDate } from '../date';
import { getFileName } from '../getFileName';
import { convertToPlainText } from '../HtmlTagsStringValue';
import { isStringifiedJSON } from '../stringValues';
import { agGridLocaleText } from './agGridLocaleText';
import DateTimeCellEditor from './DateTimeCellEditor';
import OverflowWrapper from './OverflowWrapper';
import RelationshipRefCellEditor from './RelationshipRefCellEditor';
import SelectCellEditor from './SelectCellEditor';
import { Value } from './Value';

const getColor = <Data = EntityData>(props: ICellRendererParams<Data, any | undefined>, field: string) =>
    (props.data as { coloredFields: IEntity['coloredFields'] })?.coloredFields?.[field];

const hasErrors = (data: any): data is IFailedEntity =>
    data && Array.isArray(data.errors) && data.errors.every((error) => 'type' in error && 'metadata' in error);

const isPropertyInvalid = <Data = EntityData>(props: ICellRendererParams<Data, any | undefined>, property: string, ignoreType = false) => {
    if (!ignoreType || !hasErrors(props.data)) return undefined;

    return props.data.errors.find((error) => {
        switch (error.type) {
            case ActionErrors.required:
                return (error.metadata as IRequiredConstraint).property === property;
            case ActionErrors.unique:
                return (error.metadata as IUniqueConstraint).properties.some((errorProperty) => errorProperty === property);
            case ActionErrors.validation: {
                return (error.metadata as IValidationError).path.slice(1).includes(property);
            }
            case ActionErrors.relationshipRefNotFound:
                return (error.metadata as INotFoundRelationshipRefError).property === property;
            case ActionErrors.userNotFound:
                return (error.metadata as IUsersNotFoundError).property === property;
            default:
                break;
        }
        return undefined;
    });
};

const errorColDef = <Data extends any = EntityData>(
    props: ICellRendererParams<Data, any | undefined>,
    error: IError,
    value: Partial<IEntitySingleProperty>,
    entityTemplatesMap?: IEntityTemplateMap,
) => {
    let message = '';
    switch (error.type) {
        case ActionErrors.required:
            message = i18next.t('wizard.entity.loadEntities.required');
            break;
        case ActionErrors.unique:
            message = i18next.t('wizard.entity.someEntityAlreadyHasTheSameField');
            break;
        case ActionErrors.validation: {
            const metadata = error.metadata as IValidationError;
            if (value.patternCustomErrorMessage) message = value.patternCustomErrorMessage;
            else if (metadata.message.includes('FilterValidationError')) {
                message = i18next.t('validation.notMatchingToFilter');
            } else if (metadata.message.includes('must')) {
                const allowedValues = metadata.params.allowedValues?.join(', ');
                const typeDescription = i18next.t(`propertyTypes.${value.format ?? value.type}`);
                message = `${i18next.t('wizard.entity.loadEntities.notValid')} ${allowedValues || typeDescription}`;
            } else message = metadata.message;
            break;
        }
        case ActionErrors.relationshipRefNotFound: {
            const { relatedTemplateId, relatedIdentifier } = error.metadata as INotFoundRelationshipRefError;
            message = i18next.t('wizard.entity.loadEntities.relatedEntityNotFound', {
                templateName: entityTemplatesMap?.get(relatedTemplateId)?.displayName,
                propertyName: relatedIdentifier,
            });
            break;
        }
        case ActionErrors.userNotFound: {
            const { attemptedIds, type } = error.metadata as IUsersNotFoundError;
            message = i18next.t(`wizard.entity.loadEntities.${type}`, { attemptedIds });
            break;
        }
        default:
            break;
    }

    return (
        <Box display="flex" justifyContent="center" alignItems="center" gap={1} width="100%">
            <Value hideValue={false} value={props.value ?? i18next.t('validation.required')} enumColor="#A40000" />
            <Tooltip
                title={message}
                placement="top"
                arrow
                slotProps={{
                    popper: {
                        sx: {
                            [`& .${tooltipClasses.tooltip}`]: {
                                fontSize: '1rem',
                                backgroundColor: 'white',
                                borderRadius: '10px',
                                marginLeft: '5px',
                                color: '#A40000',
                                fontWeight: 400,
                                boxShadow: '0px 2.05px 6.16px 0px #00000040',
                            },
                            '& .MuiTooltip-arrow': {
                                color: 'white',
                            },
                        },
                    },
                }}
            >
                <PriorityHigh color="error" fontSize="small" />
            </Tooltip>
        </Box>
    );
};

export const numberColDef = <Data = EntityData>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: Partial<IEntitySingleProperty>,
    hardcodedWidth: number | undefined,
    isLastColumn: boolean,
    hideColumn = false,
    hideValue = false,
    ignoreType = false,
    searchValue: string | undefined = undefined,
    editable: (data: any) => boolean = () => false,
): ColDef => {
    return {
        field,
        headerName: value.title,
        valueGetter,
        filter: 'agNumberColumnFilter',
        cellRenderer: (props: ICellRendererParams<Data, number | undefined>) => {
            const error = isPropertyInvalid(props, field, ignoreType);
            if (error) return errorColDef(props, error, value);

            return (
                <Value
                    hideValue={hideValue}
                    color={getColor(props, field)}
                    value={props.value?.toString() ?? ''}
                    isNumberField={!ignoreType}
                    searchValue={searchValue}
                />
            );
        },
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
        editable: (params) => (editable(params.data) ?? false) && value.serialStarter === undefined,
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
            precision: 2,
            step: 1,
            showStepperButtons: true,
        },
    };
};

export const regexColDef = <Data = EntityData>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: Partial<IEntitySingleProperty>,
    hardcodedWidth: number | undefined,
    isLastColumn: boolean,
    hideColumn = false,
    hideValue = false,
    ignoreType = false,
    searchValue: string | undefined = undefined,
    editable: (data: any) => boolean = () => false,
): ColDef => {
    return {
        field,
        headerName: value.title,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => {
            const error = isPropertyInvalid(props, field, ignoreType);
            if (error) return errorColDef(props, error, value);
            return <Value hideValue={hideValue} color={getColor(props, field)} value={props.value ?? ''} searchValue={searchValue} />;
        },
        valueGetter,
        filter: 'agTextColumnFilter',
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
        editable: (params) => editable(params.data) ?? false,
        cellEditor: 'agTextCellEditor',
    };
};

export const stringColDef = <Data = EntityData>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: Partial<IEntitySingleProperty>,
    hardcodedWidth: number | undefined,
    isLastColumn: boolean,
    hideColumn = false,
    hideValue = false,
    ignoreType = false,
    searchValue: string | undefined = undefined,
    editable: (data: any) => boolean = () => false,
): ColDef => {
    return {
        field,
        headerName: value.title,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => {
            const error = isPropertyInvalid(props, field, ignoreType);
            if (error) return errorColDef(props, error, value);
            return <Value hideValue={hideValue} color={getColor(props, field)} value={props.value?.toString() ?? ''} searchValue={searchValue} />;
        },
        valueGetter,
        filter: 'agTextColumnFilter',
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
        editable: (params) => editable(params.data) ?? false,
        cellEditor: value.format === 'text-area' ? 'agLargeTextCellEditor' : 'agTextCellEditor',
        cellEditorParams: (params) => ({
            ...params,
            value: convertToPlainText(params.value),
        }),
        cellEditorPopup: value.format === 'text-area',
    };
};

export const fileColDef = <Data = EntityData>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    hardcodedWidth: number | undefined,
    isLastColumn: boolean,
    hideColumn = false,
    searchValue: string | undefined = undefined,
    entityFileIdsWithTexts: ISemanticSearchResult[string][string] | undefined = undefined,
): ColDef => {
    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) =>
            props.value?.toString() ? (
                <OpenPreview
                    fileId={props.value?.toString()}
                    searchValue={searchValue}
                    entityFileIdsWithTexts={entityFileIdsWithTexts}
                    color={getColor(props, field)}
                />
            ) : null,
        filter: 'agTextColumnFilter',
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
    };
};

export const locationColDef = <Data = EntityData>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    entityGetter: ValueGetterFunc<any, any>,
    value: Partial<IEntitySingleProperty>,
    template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated,
    hardcodedWidth: number | undefined,
    isLastColumn: boolean,
    hideColumn = false,
    ignoreType = false,
    searchValue: string | undefined = undefined,
): ColDef => {
    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => {
            if (!props.value) return null;
            const error = isPropertyInvalid(props, field, ignoreType);
            if (error) return errorColDef(props, error, value);
            return (
                <OpenMap
                    field={value.title!}
                    entityProperties={entityGetter(props as any)}
                    entityTemplate={template}
                    searchValue={searchValue}
                    disableOpenMap={ignoreType}
                    color={getColor(props, field)}
                />
            );
        },
        filter: 'agTextColumnFilter',
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
    };
};

export const relatedTemplateColDef = <Data = EntityData>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: Partial<IEntitySingleProperty>,
    hardcodedWidth: number | undefined,
    relatedTemplateId: string,
    relatedTemplateField: string,
    isLastColumn: boolean,
    entityTemplates: IEntityTemplateMap,
    hideColumn = false,
    ignoreType = false,
    searchValue: string | undefined = undefined,
    editable: (data: any) => boolean = () => false,
    filters?: string | ISearchFilter,
): ColDef => {
    const relatedEntityTemplate = entityTemplates.get(relatedTemplateId!)!;

    return {
        field,
        headerName: value.title,
        cellRenderer: (props: ICellRendererParams<Data, IEntity | undefined>) => {
            const error = isPropertyInvalid(props, field, ignoreType);

            if (error) return errorColDef(props, error, value, entityTemplates);
            if (!props.value) return null;

            return (
                <RelationshipReferenceView
                    entity={props.value}
                    relatedTemplateId={relatedTemplateId}
                    relatedTemplateField={relatedTemplateField}
                    searchValue={searchValue}
                    color={getColor(props, field)}
                />
            );
        },
        valueGetter,
        filter: 'agTextColumnFilter',
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
        editable: (params) => !!(relatedEntityTemplate && editable(params.data)),
        cellEditor: RelationshipRefCellEditor,
        cellEditorParams: {
            relatedTemplateId,
            template: value,
            filters,
        },
    };
};

export const booleanColDef = <Data = EntityData>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: Partial<IEntitySingleProperty>,
    hardcodedWidth: number | undefined,
    isLastColumn: boolean,
    hideColumn = false,
    hideValue = false,
    ignoreType = false,
    searchValue: string | undefined = undefined,
    editable: (data: any) => boolean = () => false,
): ColDef => {
    const formatValue = (propertyValue: boolean | null | undefined) => {
        if (!propertyValue) return i18next.t('booleanOptions.no');
        return i18next.t('booleanOptions.yes');
    };

    const filterParams: ISetFilterParams<Data, boolean | undefined> = {
        valueFormatter: (params: ValueFormatterParams<Data, boolean | undefined>) => {
            if (params.value === null) return agGridLocaleText.blanks;

            return formatValue(params.value);
        },
        suppressMiniFilter: true,
        values: [true, false],
    };
    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props: ICellRendererParams<Data, boolean | undefined>) => {
            const error = isPropertyInvalid(props, field, ignoreType);
            if (error) return errorColDef(props, error, value);
            return <Value hideValue={hideValue} color={getColor(props, field)} value={formatValue(props.value)} searchValue={searchValue} />;
        },
        filter: 'agSetColumnFilter',
        filterParams,
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
        editable: (params) => editable(params.data) ?? false,
        cellEditor: 'agCheckboxCellEditor',
    };
};

export const enumColDef = <Data = EntityData>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: Partial<IEntitySingleProperty>,
    values: Array<string>,
    hardcodedWidth: number | undefined,
    isLastColumn: boolean,
    enumColorOptions?: Record<string, string>,
    hideColumn = false,
    hideValue = false,
    ignoreType = false,
    searchValue: string | undefined = undefined,
    editable: (data: any) => boolean = () => false,
): ColDef => {
    const filterParams: ISetFilterParams<Data, string | undefined> = {
        suppressMiniFilter: true,
        values: [...values, undefined],
    };

    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => {
            const error = isPropertyInvalid(props, field, ignoreType);
            if (error) return errorColDef(props, error, value);
            return (
                <Value
                    searchValue={searchValue}
                    hideValue={hideValue}
                    value={props.value ?? ''}
                    enumColor={(props.value && enumColorOptions?.[props.value]) ?? 'default'}
                    color={getColor(props, field)}
                />
            );
        },
        filter: 'agSetColumnFilter',
        filterParams,
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
        editable: (params) => editable(params.data) ?? false,
        cellEditor: SelectCellEditor,
        cellEditorParams: {
            options: values,
            multiple: false,
            colorsOptions: enumColorOptions,
        },
    };
};

export const enumArrayColDef = <Data = EntityData>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: Partial<IEntitySingleProperty>,
    values: Array<string>,
    hardcodedWidth: number | undefined,
    rowHeight: number,
    isLastColumn: boolean,
    enumColorOptions?: Record<string, string>,
    hideColumn = false,
    hideValue = false,
    ignoreType = false,
    searchValue: string | undefined = undefined,
    editable: (data: any) => boolean = () => false,
): ColDef => {
    const filterParams: ISetFilterParams<Data, string | undefined> = {
        suppressMiniFilter: true,
        values: [...values, undefined],
    };

    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props: ICellRendererParams<Data, string[] | undefined>) => {
            if (!props.value) return '';
            const error = isPropertyInvalid(props, field, ignoreType);
            if (error) return errorColDef(props, error, value);
            if (ignoreType) return typeof props.value === 'string' ? props.value : props.value.join(', ');

            return (
                <OverflowWrapper
                    searchValue={searchValue}
                    items={props.value}
                    getItemKey={(item) => item}
                    renderItem={(item) => (
                        <Value
                            hideValue={hideValue}
                            value={item}
                            enumColor={enumColorOptions?.[item] || 'default'}
                            color={getColor(props, field)}
                            searchValue={searchValue}
                        />
                    )}
                    containerStyle={{ height: `${rowHeight}px` }}
                />
            );
        },
        filter: 'agSetColumnFilter',
        filterParams,
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
        editable: (params) => editable(params.data) ?? false,
        cellEditor: SelectCellEditor,
        cellEditorParams: {
            options: values,
            multiple: true,
            colorsOptions: enumColorOptions,
        },
    };
};

export const userColDef = <Data = IUser>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    values: Array<string>,
    hardcodedWidth: number | undefined,
    isLastColumn: boolean,
    darkMode: boolean,
    hideColumn = false,
    userAvatarProps?: Partial<Omit<IUserAvatarProps, 'user'>>,
    ignoreType = false,
): ColDef => {
    const filterParams: ISetFilterParams<Data, string | undefined> = {
        suppressMiniFilter: true,
        values: [...values, undefined],
    };

    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props: ICellRendererParams<Data, any | undefined>) => {
            if (!props.value) return '';

            const error = isPropertyInvalid(props, field, ignoreType);
            if (error) return errorColDef(props, error, value);

            if (ignoreType && !isStringifiedJSON(props.value))
                return <Value hideValue={hideColumn} color={getColor(props, field)} value={props.value ?? ''} />;

            const user = JSON.parse(props.value);
            return (
                <Grid container gap={1}>
                    <UserAvatar
                        user={user}
                        tooltip={{ title: `${user.fullName} - ${user.hierarchy}` }}
                        chip={{
                            sx: {
                                background: darkMode ? '#1E1F2B' : '#EBEFFA',
                                color: getColor(props, field) ?? (darkMode ? '#D3D6E0' : '#53566E'),
                            },
                        }}
                        {...userAvatarProps}
                    />
                </Grid>
            );
        },

        filter: 'agTextColumnFilter',
        filterParams,
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
    };
};

export const userArrayColDef = <Data = IEntity>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    values: Array<string>,
    hardcodedWidth: number | undefined,
    rowHeight: number,
    isLastColumn: boolean,
    hideColumn = false,
    darkMode = false,
    ignoreType = false,
): ColDef => {
    const filterParams: ISetFilterParams<Data, string | undefined> = {
        suppressMiniFilter: true,
        values: [...values, undefined],
    };

    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props: ICellRendererParams<Data, any[] | undefined>) => {
            if (!props.value) return '';

            const error = isPropertyInvalid(props, field, ignoreType);
            if (error) return errorColDef(props, error, value);

            if (ignoreType) {
                if (typeof props.value === 'string') return <Value hideValue={hideColumn} color={getColor(props, field)} value={props.value ?? ''} />;
                if (Array.isArray(props.value) && props.value.some((item) => !isStringifiedJSON(item)))
                    return <Value hideValue={hideColumn} color={getColor(props, field)} value={props.value.join(', ') ?? ''} />;
            }

            return (
                <OverflowWrapper
                    items={props.value.map((val) => {
                        try {
                            return JSON.parse(val);
                        } catch {
                            return JSON.parse(JSON.stringify(val));
                        }
                    })}
                    getItemKey={(item) => item._id}
                    renderItem={(item) => (
                        <UserAvatar
                            user={item}
                            tooltip={{ title: `${item.fullName} - ${item.hierarchy}` }}
                            chip={{
                                sx: {
                                    background: darkMode ? '#1E1F2B' : '#EBEFFA',
                                    color: getColor(props, field) ?? (darkMode ? '#D3D6E0' : '#53566E'),
                                },
                            }}
                        />
                    )}
                    propertyToDisplayInTooltip="fullName"
                    containerStyle={{ height: `${rowHeight}px` }}
                />
            );
        },

        filter: 'agSetColumnFilter',
        filterParams,
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
    };
};

export const enumFilesColDef = <Data = EntityData>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: { title: string },
    hardcodedWidth: number | undefined,
    rowHeight: number,
    isLastColumn: boolean,
    hideColumn = false,
    searchValue: string | undefined = undefined,
    entityFileIdsWithTexts: ISemanticSearchResult[string][string] | undefined = undefined,
): ColDef => {
    const filterParams: ISetFilterParams<Data, string | undefined> = {
        suppressMiniFilter: true,
        values: [], // You may need to fetch enum values dynamically or provide them here
    };

    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props) => {
            const enumArray = valueGetter(props) as string[];
            if (enumArray && enumArray.length > 0) {
                const items = enumArray.map((file) => getFileName(file));
                return (
                    <OverflowWrapper
                        searchValue={searchValue}
                        items={enumArray}
                        getItemKey={(item) => item}
                        renderItem={(item) => (
                            <OpenPreview
                                fileId={item}
                                entityFileIdsWithTexts={entityFileIdsWithTexts}
                                searchValue={searchValue}
                                color={getColor(props, field)}
                            />
                        )}
                        containerStyle={{ height: `${rowHeight}px` }}
                        files={items}
                    />
                );
            }
            return null;
        },
        filter: 'agSetColumnFilter',
        filterParams,
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
    };
};

export const dateColDef = <Data = EntityData>(
    field: string,
    valueGetter: ValueGetterFunc<Data>,
    value: Partial<IEntitySingleProperty>,
    isLastColumn: boolean,
    hardcodedWidth?: number,
    hideColumn = false,
    hideValue = false,
    calculateTime = false,
    ignoreType = false,
    searchValue: string | undefined = undefined,
    editable: (data: any) => boolean = () => false,
): ColDef => {
    const { format } = value;

    const formatDate = (dateValue: string | null | undefined) => {
        if (!dateValue) return '';
        if (ignoreType) return dateValue;

        if (format === 'date') return getDateWithoutTime(new Date(dateValue));

        if (format === 'date-time') return getLongDate(new Date(dateValue));

        throw new Error(`dateColfDef must be on date/date-time property, but found property: ${value}`);
    };

    const filterParams: IDateFilterParams = {
        comparator: (filterLocalDateAtMidnight, cellValue: string) => {
            if (!cellValue) {
                return 0;
            }

            const cellDate = new Date(cellValue);

            if (cellDate < filterLocalDateAtMidnight) return -1;
            if (cellDate > filterLocalDateAtMidnight) return 1;
            return 0;
        },
    };

    return {
        field,
        headerName: value.title,
        valueGetter,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => {
            const error = isPropertyInvalid(props, field, ignoreType);
            if (error) return errorColDef(props, error, value);
            return (
                <Value
                    searchValue={searchValue}
                    hideValue={hideValue}
                    value={formatDate(props.value?.toString())}
                    calculateTime={ignoreType ? false : calculateTime}
                    color={getColor(props, field)}
                />
            );
        },
        filter: 'agDateColumnFilter',
        filterParams,
        minWidth: format === 'date-time' ? 220 : undefined,
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
        editable: (params) => editable(params.data) ?? false,
        cellEditor: DateTimeCellEditor,
        cellEditorParams: { dateOrDateTime: format === 'date-time' ? 'dateTime' : 'date' },
    };
};

interface TranslatedEnumColDefOptions<Data> {
    field: string;
    valueGetter: (params: ValueGetterParams<Data>) => string | undefined;
    title: string;
    valuesMap: Record<string, string>;
    hardcodedWidth?: number;
    hideColumn?: boolean;
    hideValue?: boolean;
    searchValue?: string;
    isLastColumn?: boolean;
}

export const translatedEnumColDef = <Data = EntityData>({
    field,
    valueGetter,
    title,
    valuesMap,
    hardcodedWidth,
    hideColumn = false,
    hideValue = false,
    searchValue = undefined,
    isLastColumn = false,
}: TranslatedEnumColDefOptions<Data>): ColDef => {
    const formatValue = (propertyValue: string | null | undefined) => (propertyValue ? valuesMap[propertyValue] : '');

    const filterParams: ISetFilterParams<Data, string | undefined> = {
        suppressMiniFilter: true,
        valueFormatter: (params: ValueFormatterParams<Date, string | undefined>) => {
            if (params.value === null) return agGridLocaleText.blanks;

            return formatValue(params.value);
        },
        values: [...Object.keys(valuesMap), undefined],
    };

    return {
        field,
        headerName: title,
        valueGetter,
        cellRenderer: (props: ICellRendererParams<Data, string | undefined>) => {
            return <Value hideValue={hideValue} value={formatValue(props.value)} searchValue={searchValue} color={getColor(props, field)} />;
        },
        filter: 'agSetColumnFilter',
        filterParams,
        width: hardcodedWidth,
        flex: isLastColumn ? 1 : 0,
        hide: hideColumn,
    };
};
