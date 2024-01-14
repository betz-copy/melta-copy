import React, { memo } from 'react';
import { Delete as DeleteIcon, ReadMore as ReadMoreIcon, Edit as EditIcon } from '@mui/icons-material';
import { ColDef, ValueGetterFunc } from '@ag-grid-community/core';
import i18next from 'i18next';
import { NavLink } from 'react-router-dom';
import { IEntity } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { booleanColDef, dateColDef, enumColDef, fileColDef, numberColDef, regexColDef, stringColDef } from '../../utils/agGrid/commonColDefs';
import IconButtonWithPopover from '../IconButtonWithPopover';

export interface IGetColumnDefsOptions<Data extends any> {
    template: IMongoEntityTemplatePopulated;
    getEntityPropertiesData: (data: Data) => IEntity['properties'];
    onNavigateToRow?: (entity: Data) => void;
    disabledEntity?: boolean;
    deleteRowButtonProps?: {
        onClick: (entity: Data) => void;
        popoverText: string;
        disabled: boolean;
    };
    hideNonPreview?: boolean;
    editRowButtonProps?: {
        onClick: (data: Data) => void;
    };
    defaultVisibleColumns?: { [key: string]: boolean };
    defaultColumnsOrder?: { [key: string]: { order: number } };
    defaultColumnWidths?: { [key: string]: number };
}

export const getColumnDefs = <Data extends any = IEntity>({
    template,
    getEntityPropertiesData,
    onNavigateToRow,
    disabledEntity = false,
    deleteRowButtonProps,
    hideNonPreview = false,
    editRowButtonProps,
    defaultVisibleColumns = {},
    defaultColumnsOrder = {},
    defaultColumnWidths = {},
}: IGetColumnDefsOptions<Data>): ColDef[] => {
    const columnDefs = Object.entries(template.properties.properties).map(([key, value]) => {
        const { type, format } = value;

        const hideField = template.properties.hide.includes(key);

        const valueGetter: ValueGetterFunc = ({ data }) => (data ? getEntityPropertiesData(data)[key] : undefined);

        const hideColumn =
            defaultVisibleColumns[key] !== undefined ? !defaultVisibleColumns[key] : hideNonPreview && !template.propertiesPreview.includes(key);

        if (type === 'number') return numberColDef(key, valueGetter, value, defaultColumnWidths[key], hideColumn, hideField);
        if (type === 'boolean') return booleanColDef(key, valueGetter, value, defaultColumnWidths[key], hideColumn, hideField);
        if (format === 'date' || format === 'date-time') return dateColDef(key, valueGetter, value, defaultColumnWidths[key], hideColumn, hideField);
        if (format === 'fileId') return fileColDef(key, valueGetter, value, defaultColumnWidths[key], hideColumn);
        if (value.enum)
            return enumColDef(
                key,
                valueGetter,
                value,
                value.enum,
                defaultColumnWidths[key],
                template.enumPropertiesColors?.[key],
                hideColumn,
                hideField,
            );
        if (value.pattern) return regexColDef(key, valueGetter, value, defaultColumnWidths[key], hideColumn, hideField);
        return stringColDef(key, valueGetter, value, defaultColumnWidths[key], hideColumn, hideField);
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
        const numberOfButtons = Number(Boolean(onNavigateToRow)) + Number(Boolean(deleteRowButtonProps)) + Number(Boolean(editRowButtonProps));
        const cellPadding = 46;
        const iconButtonWidth = 42;
        const widthToFitButtons = cellPadding + numberOfButtons * iconButtonWidth;
        const headerNameWidth = 100;
        const columnWidth = Math.max(headerNameWidth, widthToFitButtons);

        columnDefs.push({
            headerName: i18next.t('entitiesTableOfTemplate.actionsHeaderName'),
            pinned: 'left',
            menuTabs: [],
            sortable: false,
            width: columnWidth,
            minWidth: columnWidth,
            flex: 0,
            resizable: false,
            lockPosition: true,
            lockPinned: true,
            suppressColumnsToolPanel: true,
            cellRenderer: memo<{ data: Data }>(({ data }) => {
                const { disabled: disabledRow } = getEntityPropertiesData(data);
                return (
                    <div>
                        {onNavigateToRow && (
                            <NavLink
                                to={`/entity/${getEntityPropertiesData(data)._id}`}
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
                                        disabledEntity
                                            ? i18next.t('permissions.dontHavePermissionsToCategory')
                                            : i18next.t('entitiesTableOfTemplate.navigateToEntityPage')
                                    }
                                >
                                    <ReadMoreIcon
                                        style={{
                                            transform: 'scaleX(-1)',
                                        }}
                                    />
                                </IconButtonWithPopover>
                            </NavLink>
                        )}
                        {deleteRowButtonProps && (
                            <IconButtonWithPopover
                                popoverText={deleteRowButtonProps.popoverText}
                                iconButtonProps={{
                                    disabled: deleteRowButtonProps.disabled,
                                    onClick: () => deleteRowButtonProps.onClick(data),
                                }}
                            >
                                <DeleteIcon />
                            </IconButtonWithPopover>
                        )}
                        {editRowButtonProps && (
                            <IconButtonWithPopover
                                popoverText={i18next.t(disabledRow ? 'entityPage.disabledEntity' : 'entitiesTableOfTemplate.editEntity')}
                                iconButtonProps={{
                                    disabled: disabledEntity,
                                    onClick: () => editRowButtonProps.onClick(data),
                                }}
                                disabled={disabledRow}
                            >
                                <EditIcon />
                            </IconButtonWithPopover>
                        )}
                    </div>
                );
            }),
        });
    }

    return columnDefs;
};
