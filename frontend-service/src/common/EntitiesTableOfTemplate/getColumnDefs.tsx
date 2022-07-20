import React, { memo } from 'react';
import { Delete as DeleteIcon, ReadMore as ReadMoreIcon } from '@mui/icons-material';
import { ValueGetterFunc } from '@ag-grid-community/core';
import i18next from 'i18next';
import { IEntity } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { booleanColDef, dateColDef, fileColDef, numberColDef, stringColDef } from '../../utils/agGrid/commonColDefs';
import IconButtonWithPopoverText from '../IconButtonWithPopover';

export const getColumnDefs = <Data extends any>(
    template: IMongoEntityTemplatePopulated,
    getEntityPropertiesData: (data: Data) => IEntity['properties'],
    onNavigateToRow: ((entity: Data) => void) | undefined,
    disabledEntity?: boolean,
    deleteRowButtonProps?: {
        onClick: (entity: Data) => void;
        popoverText: string;
        disabled: boolean;
    },
    hideNonPreview?: boolean,
) => {
    const columnDefs = Object.entries(template.properties.properties).map(([key, value]) => {
        const { type, format } = value;

        const valueGetter: ValueGetterFunc = ({ data }) => getEntityPropertiesData(data)[key];

        const hide = hideNonPreview && !template.propertiesPreview.includes(key);

        if (type === 'number') return numberColDef(key, valueGetter, value, hide);
        if (type === 'boolean') return booleanColDef(key, valueGetter, value, hide);
        if (format === 'date' || format === 'date-time') return dateColDef(key, valueGetter, value, hide);
        if (format === 'fileId') return fileColDef(key, valueGetter, value, hide);
        return stringColDef(key, valueGetter, value, hide);
    });

    columnDefs.push(
        booleanColDef(
            'disabled',
            ({ data }) => getEntityPropertiesData(data).disabled,
            {
                title: i18next.t('entitiesTableOfTemplate.disabledHeaderName'),
            },
            true,
        ),
    );

    columnDefs.push(
        dateColDef(
            'createdAt',
            ({ data }) => getEntityPropertiesData(data).createdAt,
            {
                title: i18next.t('entityPage.createdAt'),
                format: 'date-time',
            },
            true,
        ),
    );
    columnDefs.push(
        dateColDef(
            'updatedAt',
            ({ data }) => getEntityPropertiesData(data).updatedAt,
            {
                title: i18next.t('entityPage.updatedAt'),
                format: 'date-time',
            },
            true,
        ),
    );

    if (onNavigateToRow || deleteRowButtonProps) {
        const numberOfButtons = Number(Boolean(onNavigateToRow)) + Number(Boolean(deleteRowButtonProps));
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
            suppressColumnsToolPanel: true,
            cellRenderer: memo<{ data: Data }>(({ data }) => {
                return (
                    <div>
                        {onNavigateToRow && (
                            <IconButtonWithPopoverText
                                iconButtonProps={{
                                    disabled: disabledEntity,
                                    onClick: () => onNavigateToRow(data),
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
                            </IconButtonWithPopoverText>
                        )}
                        {deleteRowButtonProps && (
                            <IconButtonWithPopoverText
                                popoverText={deleteRowButtonProps.popoverText}
                                iconButtonProps={{
                                    disabled: deleteRowButtonProps.disabled,
                                    onClick: () => deleteRowButtonProps.onClick(data),
                                }}
                            >
                                <DeleteIcon />
                            </IconButtonWithPopoverText>
                        )}
                    </div>
                );
            }),
        });
    }

    return columnDefs;
};
