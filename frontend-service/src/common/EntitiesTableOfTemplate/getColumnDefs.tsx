import { ColDef, ValueGetterFunc } from '@ag-grid-community/core';
import { Grid } from '@mui/material';
import i18next from 'i18next';
import React, { memo } from 'react';
import { Link } from 'wouter';
import { IButtonProps } from '.';
import { IEntity } from '../../interfaces/entities';
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
} from '../../utils/agGrid/commonColDefs';
import IconButtonWithPopover from '../IconButtonWithPopover';
import { ImageWithDisable } from '../ImageWithDisable';

export interface IGetColumnDefsOptions<Data extends any> {
    template: IMongoEntityTemplatePopulated;
    getEntityPropertiesData: (data: Data) => IEntity['properties'];
    onNavigateToRow?: (entity: Data) => void;
    deleteRowButtonProps?: IButtonProps<Data>;
    hideNonPreview?: boolean;
    editRowButtonProps?: IButtonProps<Data>;
    hasPermissionToCategory?: boolean;
    defaultVisibleColumns?: { [key: string]: boolean };
    defaultColumnsOrder?: { [key: string]: { order: number } };
    defaultColumnWidths?: { [key: string]: number };
    rowHeight: number;
}

export const getColumnDefs = <Data extends any = IEntity>({
    template,
    getEntityPropertiesData,
    onNavigateToRow,
    hideNonPreview = false,
    deleteRowButtonProps,
    editRowButtonProps,
    hasPermissionToCategory = true,
    defaultVisibleColumns = {},
    defaultColumnsOrder = {},
    defaultColumnWidths = {},
    rowHeight,
}: IGetColumnDefsOptions<Data>): ColDef[] => {
    const columnDefs = template.propertiesOrder.map((property) => {
        const propertyTemplate = template.properties.properties[property];
        const { type, format, calculateTime } = propertyTemplate;

        const hideField = template.properties.hide.includes(property);

        const valueGetter: ValueGetterFunc = ({ data }) => (data ? getEntityPropertiesData(data)[property] : undefined);

        const hideColumn =
            defaultVisibleColumns[property] !== undefined
                ? !defaultVisibleColumns[property]
                : hideNonPreview && !template.propertiesPreview.includes(property);

        if (type === 'number') return numberColDef(property, valueGetter, propertyTemplate, defaultColumnWidths[property], hideColumn, hideField);
        if (type === 'boolean') return booleanColDef(property, valueGetter, propertyTemplate, defaultColumnWidths[property], hideColumn, hideField);
        if (format === 'date' || format === 'date-time')
            return dateColDef(property, valueGetter, propertyTemplate, defaultColumnWidths[property], hideColumn, hideField, calculateTime);
        if (format === 'fileId') return fileColDef(property, valueGetter, propertyTemplate, defaultColumnWidths[property], hideColumn);
        if (format === 'relationshipReference')
            return relatedTemplateColDef(
                property,
                valueGetter,
                propertyTemplate,
                defaultColumnWidths[property],
                propertyTemplate.relationshipReference!.relatedTemplateId,
                propertyTemplate.relationshipReference!.relatedTemplateField,
                hideColumn,
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
            );
        if (propertyTemplate.pattern)
            return regexColDef(property, valueGetter, propertyTemplate, defaultColumnWidths[property], hideColumn, hideField);
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
            );
        if (propertyTemplate.items) {
            return enumFilesColDef(property, valueGetter, { title: propertyTemplate.title }, defaultColumnWidths[property], rowHeight);
        }
        return stringColDef(property, valueGetter, propertyTemplate, defaultColumnWidths[property], hideColumn, hideField);
    });
    columnDefs.push(
        booleanColDef(
            'disabled',
            ({ data }) => (data ? getEntityPropertiesData(data).disabled : undefined),
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
            ({ data }) => (data ? getEntityPropertiesData(data).createdAt : undefined),
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
            ({ data }) => (data ? getEntityPropertiesData(data).updatedAt : undefined),
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

    if (onNavigateToRow || deleteRowButtonProps || editRowButtonProps) {
        columnDefs.push({
            headerName: i18next.t('entitiesTableOfTemplate.actionsHeaderName'),
            pinned: 'left',
            menuTabs: [],
            sortable: false,
            width: 180,
            flex: 0,
            resizable: false,
            lockPosition: true,
            lockPinned: true,
            suppressColumnsToolPanel: true,
            cellRenderer: memo<{ data: Data }>(({ data }) => {
                const { disabled: disabledEntity } = getEntityPropertiesData(data);
                return (
                    <Grid flexWrap="nowrap">
                        {onNavigateToRow && (
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
                        )}
                        {deleteRowButtonProps && (
                            <IconButtonWithPopover
                                popoverText={disabledEntity ? i18next.t('entityPage.disabledEntity') : deleteRowButtonProps.popoverText}
                                iconButtonProps={{
                                    onClick: () => deleteRowButtonProps.onClick(data),
                                }}
                                disabled={deleteRowButtonProps.disabledButton || disabledEntity}
                            >
                                <ImageWithDisable srcPath="/icons/delete-icon.svg" disabled={deleteRowButtonProps.disabledButton || disabledEntity} />
                            </IconButtonWithPopover>
                        )}
                        {editRowButtonProps && (
                            <IconButtonWithPopover
                                popoverText={disabledEntity ? i18next.t('entityPage.disabledEntity') : editRowButtonProps.popoverText}
                                iconButtonProps={{
                                    onClick: () => editRowButtonProps.onClick(data),
                                }}
                                disabled={editRowButtonProps.disabledButton || disabledEntity}
                            >
                                <ImageWithDisable srcPath="/icons/edit-icon.svg" disabled={editRowButtonProps.disabledButton || disabledEntity} />
                            </IconButtonWithPopover>
                        )}

                        {onNavigateToRow && (
                            <Link
                                href={`/entity/${getEntityPropertiesData(data)._id}/graph`}
                                onClick={(e) => {
                                    if (disabledEntity) e.preventDefault();
                                }}
                                data-tour="entity-page"
                            >
                                <IconButtonWithPopover
                                    iconButtonProps={{
                                        disabled: disabledEntity,
                                    }}
                                    popoverText={disabledEntity ? i18next.t('permissions.dontHavePermissionsToCategory') : i18next.t('actions.graph')}
                                >
                                    <img src="/icons/graph-icon.svg" />
                                </IconButtonWithPopover>
                            </Link>
                        )}
                    </Grid>
                );
            }),
        });
    }

    return columnDefs;
};
