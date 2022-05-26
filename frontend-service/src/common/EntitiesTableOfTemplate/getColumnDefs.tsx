import React, { memo } from 'react';
import { Delete as DeleteIcon, ReadMore as ReadMoreIcon } from '@mui/icons-material';
import { ColDef, ValueGetterFunc } from '@ag-grid-community/core';
import i18next from 'i18next';
import { IEntity } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { booleanColDef, dateColDef, fileColDef, numberColDef, stringColDef } from '../../utils/agGrid/commonColDefs';
import IconButtonWithPopoverText from '../IconButtonWithPopover';

export const getColumnDefs = <Data extends any>(
    template: IMongoEntityTemplatePopulated,
    actionsColumnId: string,
    getEntityPropertiesData: (data: Data) => IEntity['properties'],
    onNavigateToRow: ((entity: Data) => void) | undefined,
    disabledEntity?: boolean,
    deleteRowButtonProps?: {
        onClick: (entity: Data) => void;
        popoverText: string;
        disabled: boolean;
    },
) => {
    const columnDefs = Object.entries(template.properties.properties).map(([key, value]) => {
        const { type, format } = value;

        const valueGetter: ValueGetterFunc = ({ data }) => getEntityPropertiesData(data)[key];

        if (type === 'number') return numberColDef(key, valueGetter, value);
        if (type === 'boolean') return booleanColDef(key, valueGetter, value);
        if (format === 'date' || format === 'date-time') return dateColDef(key, valueGetter, value);
        if (format === 'fileId') return fileColDef(key, valueGetter, value);
        return stringColDef(key, valueGetter, value);
    });

    if (onNavigateToRow || deleteRowButtonProps) {
        const addedColumns: ColDef[] = [
            {
                colId: actionsColumnId, // used for autoSizeColumns onFirstDataRendered
                headerName: i18next.t('entitiesTableOfTemplate.actionsHeaderName'),
                pinned: 'left',
                menuTabs: [],
                sortable: false,
                minWidth: 0,
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
            },
        ];

        columnDefs.push(...addedColumns);
    }

    return columnDefs;
};
