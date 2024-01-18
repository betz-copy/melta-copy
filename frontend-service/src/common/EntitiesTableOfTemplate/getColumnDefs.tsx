import React, { memo } from 'react';
import { Delete as DeleteIcon, ReadMore as ReadMoreIcon, Edit as EditIcon } from '@mui/icons-material';
import { ColDef, ValueGetterFunc } from '@ag-grid-community/core';
import i18next from 'i18next';
import { NavLink } from 'react-router-dom';
import { IEntity } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { booleanColDef, dateColDef, enumColDef, fileColDef, numberColDef, regexColDef, stringColDef } from '../../utils/agGrid/commonColDefs';
import IconButtonWithPopover from '../IconButtonWithPopover';

interface IGetColumnDefsOptions<Data extends any> {
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
}

export const getColumnDefs = <Data extends any = IEntity>({
    template,
    getEntityPropertiesData,
    onNavigateToRow,
    disabledEntity = false,
    deleteRowButtonProps,
    hideNonPreview = false,
    editRowButtonProps,
}: IGetColumnDefsOptions<Data>): ColDef[] => {
    const columnDefs = template.propertiesOrder.map((property) => {
        const propertyTemplate = template.properties.properties[property];
        const { type, format } = propertyTemplate;

        const hideField = template.properties.hide.includes(property);

        const valueGetter: ValueGetterFunc = ({ data }) => (data ? getEntityPropertiesData(data)[property] : undefined);

        const hideColumn = hideNonPreview && !template.propertiesPreview.includes(property);

        if (type === 'number') return numberColDef(property, valueGetter, propertyTemplate, hideColumn, hideField);
        if (type === 'boolean') return booleanColDef(property, valueGetter, propertyTemplate, hideColumn, hideField);
        if (format === 'date' || format === 'date-time') return dateColDef(property, valueGetter, propertyTemplate, hideColumn, hideField);
        if (format === 'fileId') return fileColDef(property, valueGetter, propertyTemplate, hideColumn);
        if (propertyTemplate.enum)
            return enumColDef(
                property,
                valueGetter,
                propertyTemplate,
                propertyTemplate.enum,
                template.enumPropertiesColors?.[property],
                hideColumn,
                hideField,
            );
        if (propertyTemplate.pattern) return regexColDef(property, valueGetter, propertyTemplate, hideColumn, hideField);
        return stringColDef(property, valueGetter, propertyTemplate, hideColumn, hideField);
    });

    columnDefs.push(
        booleanColDef(
            'disabled',
            ({ data }) => (data ? getEntityPropertiesData(data).disabled : undefined),
            {
                title: i18next.t('entitiesTableOfTemplate.disabledHeaderName'),
            },
            true,
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
            true,
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
            true,
        ),
    );

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
