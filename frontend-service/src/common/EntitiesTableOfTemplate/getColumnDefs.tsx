import React, { memo } from 'react';
import { Delete as DeleteIcon, ReadMore as ReadMoreIcon, Edit as EditIcon} from '@mui/icons-material';
import { ColDef, ValueGetterFunc } from '@ag-grid-community/core';
import i18next from 'i18next';
import { NavLink } from 'react-router-dom';
import { IEntity } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { booleanColDef, dateColDef, enumColDef, fileColDef, numberColDef, regexColDef, stringColDef } from '../../utils/agGrid/commonColDefs';
import IconButtonWithPopoverText from '../IconButtonWithPopover';

interface IGetColumnDefsOptions<Data extends any> {
    template: IMongoEntityTemplatePopulated,
    getEntityPropertiesData: (data: Data) => IEntity['properties'],
    onNavigateToRow?: ((entity: Data) => void),
    disabledEntity?: boolean,
    deleteRowButtonProps?: {
      onClick: (entity: Data) => void;
      popoverText: string;
      disabled: boolean;
    },
    hideNonPreview?: boolean,
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
    const columnDefs = Object.entries(template.properties.properties).map(([key, value]) => {
        const { type, format } = value;

        const hideField = template.properties.hide.includes(key);

        const valueGetter: ValueGetterFunc = ({ data }) => (data ? getEntityPropertiesData(data)[key] : undefined);
        

        const hideColumn = hideNonPreview && !template.propertiesPreview.includes(key);

        if (type === 'number') return numberColDef(key, valueGetter, value, hideColumn, hideField);
        if (type === 'boolean') return booleanColDef(key, valueGetter, value, hideColumn, hideField);
        if (format === 'date' || format === 'date-time') return dateColDef(key, valueGetter, value, hideColumn, hideField);
        if (format === 'fileId') return fileColDef(key, valueGetter, value, hideColumn);
        if (value.enum) return enumColDef(key, valueGetter, value, value.enum, hideColumn, hideField);
        if (value.pattern) return regexColDef(key, valueGetter, value, hideColumn, hideField);
        return stringColDef(key, valueGetter, value, hideColumn, hideField);
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
                                <IconButtonWithPopoverText
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
                                </IconButtonWithPopoverText>
                            </NavLink>
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
                         { editRowButtonProps && (
                            <IconButtonWithPopoverText
                                popoverText={i18next.t('entitiesTableOfTemplate.editEntity')}
                                iconButtonProps={{
                                    disabled: disabledEntity,
                                    onClick: () => {
                                        editRowButtonProps.onClick(data);
                                    }
                                    
                                }}
                            >
                                <EditIcon />
                            </IconButtonWithPopoverText>
                        )}
                    </div>
                );
            }),
        });
    }

    return columnDefs;
};
