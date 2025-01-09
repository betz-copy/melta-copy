import { ColDef, ValueGetterFunc } from '@ag-grid-community/core';
import { Grid } from '@mui/material';
import i18next from 'i18next';
import React, { memo } from 'react';
import { Link } from 'wouter';
import { AxiosError } from 'axios';
import { UseMutateAsyncFunction } from 'react-query';
import { IButtonPopoverProps } from '.';
import { EntityData, IEntity } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import {
    booleanColDef,
    dateColDef,
    enumArrayColDef,
    enumColDef,
    enumFilesColDef,
    fileColDef,
    numberColDef,
    regexColDef,
    relatedTemplateColDef,
    stringColDef,
    userArrayColDef,
    userColDef,
} from '../../utils/agGrid/commonColDefs';
import IconButtonWithPopover from '../IconButtonWithPopover';
import { ImageWithDisable } from '../ImageWithDisable';
import { CardMenu } from '../../pages/SystemManagement/components/CardMenu';
import { IRuleBreach } from '../../interfaces/ruleBreaches/ruleBreach';
import { ISemanticSearchResult } from '../../interfaces/semanticSearch';

export interface IGetColumnDefsOptions<Data extends any> {
    template: IMongoEntityTemplatePopulated & { entitiesWithFiles?: ISemanticSearchResult[string] };
    getRowId: (data: Data) => string;
    getEntityPropertiesData: (data: Data) => Partial<IEntity['properties']>;
    onNavigateToRow?: (entity: Data) => void;
    deleteRowButtonProps?: IButtonPopoverProps<Data>;
    menuRowButtonProps?: boolean;
    hideNonPreview?: boolean;
    editRowButtonProps?: IButtonPopoverProps<Data>;
    hasPermissionToCategory?: boolean;
    defaultVisibleColumns?: { [key: string]: boolean };
    defaultColumnsOrder?: { [key: string]: { order: number } };
    defaultColumnWidths?: { [key: string]: number };
    rowHeight: number;
    ignoreType?: boolean;
    navigate: (to: string, options?: { replace?: boolean; state?: any }) => void;
    setSelectedRow: React.Dispatch<React.SetStateAction<string>>;
    setOpenDeleteDialog: React.Dispatch<React.SetStateAction<boolean>>;
    updateEntityStatus: UseMutateAsyncFunction<
        IEntity,
        AxiosError<any, any>,
        { currEntity: IEntity; disabled: boolean; ignoredRules?: IRuleBreach['brokenRules'] },
        unknown
    >;
    searchValue?: string;
    disableEditCell?: boolean;
}

export const getColumnDefs = <Data extends any = EntityData>({
    template,
    getRowId,
    getEntityPropertiesData,
    onNavigateToRow,
    hideNonPreview = false,
    deleteRowButtonProps,
    editRowButtonProps,
    menuRowButtonProps,
    hasPermissionToCategory = true,
    defaultVisibleColumns = {},
    defaultColumnsOrder = {},
    defaultColumnWidths = {},
    rowHeight,
    ignoreType,
    navigate,
    setSelectedRow,
    setOpenDeleteDialog,
    updateEntityStatus,
    searchValue,
    disableEditCell,
}: IGetColumnDefsOptions<Data>): ColDef[] => {
    const columnDefs = template.propertiesOrder.map((property) => {
        const propertyTemplate = { ...template.properties.properties[property] };
        const hiddenProperties = template.properties.hide;
        const { type, format, calculateTime, archive } = propertyTemplate;

        const hideField = template.properties.hide.includes(property);

        const valueGetter: ValueGetterFunc = ({ data }) => (data ? getEntityPropertiesData(data)[property] : undefined);

        const hideColumn =
            archive ||
            (defaultVisibleColumns[property] !== undefined
                ? !defaultVisibleColumns[property]
                : hideNonPreview && !template.propertiesPreview.includes(property));

        if (propertyTemplate.archive) propertyTemplate.title = `${propertyTemplate.title} ${i18next.t('entitiesTableOfTemplate.archiveTitle')}`;

        const editable = (data: any) =>
            !disableEditCell && !propertyTemplate.readOnly && data && !getEntityPropertiesData(data).disabled && !hiddenProperties.includes(property);

        if (type === 'number')
            return numberColDef(
                property,
                valueGetter,
                propertyTemplate,
                defaultColumnWidths[property],
                hideColumn,
                hideField,
                ignoreType,
                searchValue,
                editable,
            );
        if (type === 'boolean')
            return booleanColDef(
                property,
                valueGetter,
                propertyTemplate,
                defaultColumnWidths[property],
                hideColumn,
                hideField,
                ignoreType,
                searchValue,
                editable,
            );
        if (format === 'date' || format === 'date-time')
            return dateColDef(
                property,
                valueGetter,
                propertyTemplate,
                defaultColumnWidths[property],
                hideColumn,
                hideField,
                calculateTime,
                ignoreType,
                searchValue,
                editable,
            );
        if (format === 'fileId')
            return fileColDef(
                property,
                valueGetter,
                propertyTemplate,
                defaultColumnWidths[property],
                hideColumn,
                searchValue,
                Object.values(template.entitiesWithFiles ?? {}).flat(),
            );
        if (format === 'relationshipReference')
            return relatedTemplateColDef(
                property,
                valueGetter,
                propertyTemplate,
                defaultColumnWidths[property],
                propertyTemplate.relationshipReference!.relatedTemplateId,
                propertyTemplate.relationshipReference!.relatedTemplateField,
                hideColumn,
                searchValue,
                editable,
            );
        if (propertyTemplate.enum)
            return enumColDef(
                property,
                valueGetter,
                propertyTemplate,
                propertyTemplate.enum,
                defaultColumnWidths[property],
                template.enumPropertiesColors?.[property],
                hideColumn,
                hideField,
                ignoreType,
                searchValue,
                editable,
            );
        if (propertyTemplate.pattern)
            return regexColDef(
                property,
                valueGetter,
                propertyTemplate,
                defaultColumnWidths[property],
                hideColumn,
                hideField,
                ignoreType,
                searchValue,
                editable,
            );
        if (propertyTemplate.items?.enum)
            return enumArrayColDef(
                property,
                valueGetter,
                propertyTemplate,
                propertyTemplate.items.enum,
                defaultColumnWidths[property],
                rowHeight,
                template.enumPropertiesColors?.[property],
                hideColumn,
                hideField,
                ignoreType,
                searchValue,
                editable,
            );
        if (propertyTemplate.items?.format === 'fileId') {
            return enumFilesColDef(property, valueGetter, { title: propertyTemplate.title }, defaultColumnWidths[property], rowHeight);
        }
        if (propertyTemplate.format === 'user') {
            return userColDef(property, valueGetter, { title: propertyTemplate.title }, [], defaultColumnWidths[property], hideColumn);
        }
        if (propertyTemplate.items?.format === 'user') {
            return userArrayColDef(
                property,
                valueGetter,
                { title: propertyTemplate.title },
                [],
                defaultColumnWidths[property],
                rowHeight,
                hideColumn,
            );
        }
        return stringColDef(
            property,
            valueGetter,
            propertyTemplate,
            defaultColumnWidths[property],
            hideColumn,
            hideField,
            ignoreType,
            searchValue,
            editable,
        );
    });

    columnDefs.push(
        booleanColDef(
            'disabled',
            ({ data }) => (data ? getEntityPropertiesData(data as Data).disabled : undefined),
            {
                title: i18next.t('entitiesTableOfTemplate.disabledHeaderName'),
            },
            defaultColumnWidths.disabled,
            defaultVisibleColumns.disabled !== undefined ? !defaultVisibleColumns.disabled : true,
        ),
    );

    columnDefs.push(
        dateColDef(
            'createdAt',
            ({ data }) => (data ? getEntityPropertiesData(data as Data).createdAt : undefined),
            {
                title: i18next.t('entityPage.createdAt'),
                format: 'date-time',
            },
            defaultColumnWidths.createdAt,
            defaultVisibleColumns.createdAt !== undefined ? !defaultVisibleColumns.createdAt : true,
        ),
    );

    columnDefs.push(
        dateColDef(
            'updatedAt',
            ({ data }) => (data ? getEntityPropertiesData(data as Data).updatedAt : undefined),
            {
                title: i18next.t('entityPage.updatedAt'),
                format: 'date-time',
            },
            defaultColumnWidths.updatedAt,
            defaultVisibleColumns.updatedAt !== undefined ? !defaultVisibleColumns.updatedAt : true,
        ),
    );

    columnDefs.sort((a, b) => {
        if (!a.field || !b.field) return 0;

        const orderA = defaultColumnsOrder[a.field]?.order;
        const orderB = defaultColumnsOrder[b.field]?.order;

        // If the result is less than 0, a is sorted before b.
        // If the result is 0, the order of a and b remains unchanged.
        // If the result is greater than 0, b is sorted before a.
        return orderA - orderB;
    });

    if (onNavigateToRow || deleteRowButtonProps || editRowButtonProps || menuRowButtonProps) {
        columnDefs.push({
            headerName: i18next.t('entitiesTableOfTemplate.actionsHeaderName'),
            pinned: 'left',
            menuTabs: [],
            sortable: false,
            width: 200,
            flex: 0,
            resizable: false,
            lockPosition: true,
            lockPinned: true,
            suppressColumnsToolPanel: true,
            cellStyle: {
                display: 'flex',
                justifyContent: 'center',
            },
            cellRenderer: memo<{ data: Data }>(({ data }) => {
                const entity = getEntityPropertiesData(data);
                const { disabled: disabledEntity } = entity;

                return (
                    <Grid container flexWrap="nowrap">
                        {onNavigateToRow && (
                            <Grid item>
                                <Link
                                    href={`/entity/${getEntityPropertiesData(data)._id}`}
                                    onClick={(e) => {
                                        if (!hasPermissionToCategory) e.preventDefault();
                                    }}
                                    data-tour="entity-page"
                                >
                                    <IconButtonWithPopover
                                        popoverText={
                                            !hasPermissionToCategory
                                                ? i18next.t('permissions.dontHavePermissionToEntityPage')
                                                : i18next.t('entitiesTableOfTemplate.navigateToEntityPage')
                                        }
                                        disabled={!hasPermissionToCategory}
                                    >
                                        <img src="/icons/read-more-icon.svg" />
                                    </IconButtonWithPopover>
                                </Link>
                            </Grid>
                        )}
                        {deleteRowButtonProps && (
                            <Grid item>
                                <IconButtonWithPopover
                                    popoverText={disabledEntity ? i18next.t('entityPage.disabledEntity') : deleteRowButtonProps.popoverText}
                                    iconButtonProps={{
                                        onClick: () => deleteRowButtonProps.onClick(data),
                                    }}
                                    disabled={deleteRowButtonProps.disabledButton || disabledEntity}
                                >
                                    <ImageWithDisable
                                        srcPath="/icons/delete-icon.svg"
                                        disabled={deleteRowButtonProps.disabledButton || disabledEntity}
                                    />
                                </IconButtonWithPopover>
                            </Grid>
                        )}
                        {editRowButtonProps && (
                            <Grid item>
                                <IconButtonWithPopover
                                    popoverText={disabledEntity ? i18next.t('entityPage.disabledEntity') : editRowButtonProps.popoverText}
                                    iconButtonProps={{
                                        onClick: () => editRowButtonProps.onClick(data),
                                    }}
                                    disabled={editRowButtonProps.disabledButton || disabledEntity}
                                >
                                    <ImageWithDisable srcPath="/icons/edit-icon.svg" disabled={editRowButtonProps.disabledButton || disabledEntity} />
                                </IconButtonWithPopover>
                            </Grid>
                        )}
                        {onNavigateToRow && (
                            <Grid item>
                                <Link
                                    href={`/entity/${getRowId(data)}/graph`}
                                    onClick={(e) => {
                                        if (disabledEntity) e.preventDefault();
                                    }}
                                    data-tour="entity-page"
                                >
                                    <IconButtonWithPopover
                                        iconButtonProps={{
                                            disabled: disabledEntity,
                                        }}
                                        popoverText={
                                            disabledEntity ? i18next.t('permissions.dontHavePermissionsToCategory') : i18next.t('actions.graph')
                                        }
                                    >
                                        <img src="/icons/graph-icon.svg" />
                                    </IconButtonWithPopover>
                                </Link>
                            </Grid>
                        )}

                        {menuRowButtonProps && (
                            <Grid item>
                                <CardMenu
                                    onDuplicateClick={() => {
                                        navigate(`/entity/${getRowId(data)}/duplicate`, {
                                            state: { entityTemplate: template, expandedEntity: { entity: data } },
                                        });
                                    }}
                                    onDeleteClick={() => {
                                        setSelectedRow(getRowId(data));
                                        setOpenDeleteDialog(true);
                                    }}
                                    onDisableClick={() => {
                                        updateEntityStatus({ currEntity: data as IEntity, disabled: !getEntityPropertiesData(data).disabled });
                                    }}
                                    disabledProps={{
                                        isDisabled: getEntityPropertiesData(data).disabled,
                                        isEditDisabled: menuRowButtonProps,
                                        tooltipTitle: i18next.t('systemManagement.disabledEntity'),
                                    }}
                                />
                            </Grid>
                        )}
                    </Grid>
                );
            }),
        });
    }

    return columnDefs;
};
