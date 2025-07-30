import { ColDef, ValueGetterFunc } from '@ag-grid-community/core';
import { Add as AddIcon } from '@mui/icons-material';
import { Grid, Typography } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { memo } from 'react';
import { UseMutateAsyncFunction } from 'react-query';
import { Link } from 'wouter';
import { IButtonPopoverProps } from '.';
import { EntityData, IEntity } from '../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IRuleBreach } from '../../interfaces/ruleBreaches/ruleBreach';
import { ISemanticSearchResult } from '../../interfaces/semanticSearch';
import { CardMenu } from '../../pages/SystemManagement/components/CardMenu';
import {
    booleanColDef,
    dateColDef,
    enumArrayColDef,
    enumColDef,
    enumFilesColDef,
    fileColDef,
    locationColDef,
    numberColDef,
    regexColDef,
    relatedTemplateColDef,
    stringColDef,
    userArrayColDef,
    userColDef,
} from '../../utils/agGrid/commonColDefs';
import { AddEntityButton } from '../EntitiesPage/Buttons/AddEntity';
import IconButtonWithPopover from '../IconButtonWithPopover';
import { ImageWithDisable } from '../ImageWithDisable';
import { environment } from '../../globals';
import { IChildTemplateMap, IMongoChildTemplatePopulated } from '../../interfaces/childTemplates';
import { isChildTemplate } from '../../utils/templates';
import { emptyEntityTemplate } from '../dialogs/entity';
import { isUserHasWritePermissions } from '../EntitiesPage/TemplateTable';
import { UserState } from '../../stores/user';
import { IChooseTemplateMode } from '../dialogs/entity/ChooseTemplate';
import { getChildrenWithWritePermission } from '../../utils/childTemplates';

export interface IGetColumnDefsOptions<Data extends any> {
    template: (IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated) & { entitiesWithFiles?: ISemanticSearchResult[string] };
    getRowId: (data: Data) => string;
    getEntityPropertiesData: (data: Data) => Partial<IEntity['properties']>;
    onNavigateToRow?: (entity: Data) => void;
    deleteRowButtonProps?: IButtonPopoverProps<Data>;
    addRelationshipReferenceButtonProps?: string;
    menuRowButtonProps?: boolean;
    hideNonPreview?: boolean;
    editRowButtonProps?: IButtonPopoverProps<Data>;
    hasPermissionToTemplate?: boolean;
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
    entityTemplates: IEntityTemplateMap;
    pageType?: string;
    columnsToShow?: string[];
    entityTemplateMap?: IEntityTemplateMap;
    childEntityTemplateMap?: IChildTemplateMap;
    currentUser: UserState['user'];
    currentClientSideUser: IEntity;
}

export const getColumnDefs = <Data extends any = EntityData>({
    template,
    getRowId,
    getEntityPropertiesData,
    onNavigateToRow,
    hideNonPreview = false,
    deleteRowButtonProps,
    addRelationshipReferenceButtonProps,
    editRowButtonProps,
    menuRowButtonProps,
    hasPermissionToTemplate = true,
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
    entityTemplates,
    pageType,
    columnsToShow,
    entityTemplateMap,
    childEntityTemplateMap,
    currentUser,
    currentClientSideUser,
}: IGetColumnDefsOptions<Data>): ColDef[] => {
    const invisibleColumnsAmount = Object.values(defaultVisibleColumns).filter((value) => value === false).length;
    const lastColumnIndex = Object.keys(defaultColumnsOrder).length - invisibleColumnsAmount - 2;
    const firstTwoPropsOrder = template.propertiesOrder.slice(0, 2);

    const filteredProperties = template.propertiesOrder.filter((propertyOrder) => !template.properties.properties[propertyOrder]?.comment && template.properties.properties[propertyOrder]?.display !== false);

    const columnDefs = filteredProperties.map((property) => {
        const propertyTemplate = { ...template.properties.properties[property] };
        const hiddenProperties = template.properties.hide;
        const { type, format, calculateTime, archive } = propertyTemplate;

        const isLastColumn = defaultColumnsOrder[property]?.order === lastColumnIndex;

        const hideField = template.properties.hide.includes(property);

        const valueGetter: ValueGetterFunc = ({ data }) => (data ? getEntityPropertiesData(data)[property] : undefined);
        const entityGetter: ValueGetterFunc = ({ data }) => (data ? getEntityPropertiesData(data) : undefined);

        const isPreviewEmpty = template.propertiesPreview.length === 0;
        const isPropertyInPreview = template.propertiesPreview.includes(property);
        const isFirstTwoProperties = firstTwoPropsOrder.includes(property);
        const isDefaultVisibilityColumn = defaultVisibleColumns[property] !== undefined;
        const isColumnInDisplayList = columnsToShow?.includes(property) ?? true;

        const hideColumn =
            (isPreviewEmpty && hideNonPreview && !isFirstTwoProperties) ||
            archive ||
            (isDefaultVisibilityColumn ? !defaultVisibleColumns[property] : hideNonPreview && !isPropertyInPreview) ||
            !isColumnInDisplayList;

        if (propertyTemplate.archive) propertyTemplate.title = `${propertyTemplate.title} ${i18next.t('entitiesTableOfTemplate.archiveTitle')}`;

        const editable = (data: any) =>
            !disableEditCell && !propertyTemplate.readOnly && data && !getEntityPropertiesData(data).disabled && !hiddenProperties.includes(property);

        if (type === 'number')
            return numberColDef(
                property,
                valueGetter,
                propertyTemplate,
                defaultColumnWidths[property],
                isLastColumn,
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
                isLastColumn,
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
                isLastColumn,
                defaultColumnWidths[property],
                hideColumn,
                hideField,
                calculateTime,
                ignoreType,
                searchValue,
                editable,
            );
        if (format === 'fileId' || format === 'signature')
            return fileColDef(
                property,
                valueGetter,
                propertyTemplate,
                defaultColumnWidths[property],
                isLastColumn,
                hideColumn,
                searchValue,
                Object.values(template.entitiesWithFiles ?? {}).flat(),
            );
        if (format === 'location')
            return locationColDef(
                property,
                valueGetter,
                entityGetter,
                propertyTemplate,
                template,
                defaultColumnWidths[property],
                isLastColumn,
                hideColumn,
                ignoreType,
                searchValue,
            );
        if (format === 'relationshipReference')
            return relatedTemplateColDef(
                property,
                valueGetter,
                propertyTemplate,
                defaultColumnWidths[property],
                propertyTemplate.relationshipReference!.relatedTemplateId,
                propertyTemplate.relationshipReference!.relatedTemplateField,
                isLastColumn,
                entityTemplates,
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
                isLastColumn,
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
                isLastColumn,
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
                isLastColumn,
                template.enumPropertiesColors?.[property],
                hideColumn,
                hideField,
                ignoreType,
                searchValue,
                editable,
            );
        if (propertyTemplate.items?.format === 'fileId') {
            return enumFilesColDef(
                property,
                valueGetter,
                { title: propertyTemplate.title },
                defaultColumnWidths[property],
                rowHeight,
                isLastColumn,
                hideColumn,
            );
        }
        if (propertyTemplate.format === 'user') {
            return userColDef(property, valueGetter, { title: propertyTemplate.title }, [], defaultColumnWidths[property], isLastColumn, hideColumn);
        }
        if (propertyTemplate.items?.format === 'user') {
            return userArrayColDef(
                property,
                valueGetter,
                { title: propertyTemplate.title },
                [],
                defaultColumnWidths[property],
                rowHeight,
                isLastColumn,
                hideColumn,
            );
        }
        return stringColDef(
            property,
            valueGetter,
            propertyTemplate,
            defaultColumnWidths[property],
            isLastColumn,
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
            defaultColumnsOrder.disable?.order === lastColumnIndex,
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
            defaultColumnsOrder.createdAt?.order === lastColumnIndex,
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
            defaultColumnsOrder.updatedAt?.order === lastColumnIndex,
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

    if (onNavigateToRow || deleteRowButtonProps || editRowButtonProps || menuRowButtonProps || addRelationshipReferenceButtonProps) {
        columnDefs.push({
            field: `actions-${template._id}`,
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

                const destTemplate = addRelationshipReferenceButtonProps
                    ? childEntityTemplateMap?.get(addRelationshipReferenceButtonProps) ?? entityTemplateMap?.get(addRelationshipReferenceButtonProps)
                    : undefined;

                const getInitialProperties = (relatedTemplate: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated): Record<string, any> => {
                    const relatedProperties = relatedTemplate.properties.properties ?? {};

                    return Object.entries(relatedProperties).reduce((acc, [key, prop]) => {
                        if (prop.relationshipReference?.relatedTemplateId === template._id) {
                            acc[key] = {
                                templateId: template._id,
                                properties: entity,
                            };
                        }
                        return acc;
                    }, {} as Record<string, any>);
                };

                return (
                    <Grid container flexWrap="nowrap">
                        {onNavigateToRow && (
                            <Grid item>
                                <Link
                                    href={`/${pageType === environment.clientSideId ? `${environment.clientSideId}/entity` : 'entity'}/${
                                        getEntityPropertiesData(data)._id
                                    }${
                                        pageType === environment.clientSideId
                                            ? ''
                                            : isChildTemplate(template)
                                            ? `?childTemplateId=${template._id}`
                                            : ''
                                    }`}
                                    onClick={(e) => {
                                        if (!hasPermissionToTemplate) e.preventDefault();
                                    }}
                                    data-tour="entity-page"
                                >
                                    <IconButtonWithPopover
                                        popoverText={
                                            !hasPermissionToTemplate
                                                ? i18next.t('permissions.dontHavePermissionToEntityPage')
                                                : i18next.t('entitiesTableOfTemplate.navigateToEntityPage')
                                        }
                                        disabled={!hasPermissionToTemplate}
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
                                    popoverText={
                                        disabledEntity || template.disabled ? i18next.t('entityPage.disabledEntity') : editRowButtonProps.popoverText
                                    }
                                    iconButtonProps={{
                                        onClick: () => editRowButtonProps.onClick(data),
                                    }}
                                    disabled={editRowButtonProps.disabledButton || disabledEntity || template.disabled}
                                >
                                    <ImageWithDisable
                                        srcPath="/icons/edit-icon.svg"
                                        disabled={editRowButtonProps.disabledButton || disabledEntity || template.disabled}
                                    />
                                </IconButtonWithPopover>
                            </Grid>
                        )}
                        {onNavigateToRow && pageType !== environment.clientSideId && (
                            <Grid item>
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
                                        popoverText={
                                            disabledEntity ? i18next.t('permissions.dontHavePermissionsToCategory') : i18next.t('actions.graph')
                                        }
                                    >
                                        <img src="/icons/graph-icon.svg" />
                                    </IconButtonWithPopover>
                                </Link>
                            </Grid>
                        )}
                        {menuRowButtonProps && !template?.disabled && pageType !== environment.clientSideId && (
                            <Grid item>
                                <CardMenu
                                    onDuplicateClick={() => {
                                        navigate(
                                            `/entity/${getRowId(data)}/duplicate${
                                                isChildTemplate(template) ? `?childTemplateId=${template._id}` : ''
                                            }`,
                                            {
                                                state: { entityTemplate: template, expandedEntity: { entity: data } },
                                            },
                                        );
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

                        {addRelationshipReferenceButtonProps && (
                            <Grid item sx={{ display: 'flex', alignItems: 'center' }}>
                                <AddEntityButton
                                    initialStep={1}
                                    disabled={
                                        destTemplate
                                            ? !isUserHasWritePermissions(currentClientSideUser, currentUser, destTemplate) || destTemplate?.disabled
                                            : childEntityTemplateMap
                                            ? !getChildrenWithWritePermission(
                                                  childEntityTemplateMap,
                                                  addRelationshipReferenceButtonProps,
                                                  currentUser,
                                                  currentClientSideUser,
                                              ).length
                                            : true
                                    }
                                    initialValues={{
                                        template: destTemplate || emptyEntityTemplate,
                                        properties: {
                                            disabled: false,
                                            ...(getInitialProperties(destTemplate || emptyEntityTemplate) ?? {}),
                                        },
                                        attachmentsProperties: {},
                                    }}
                                    style={{ borderRadius: '7px', width: '135px' }}
                                    popoverText={template.disabled ? i18next.t('permissions.EntityTemplateDisplay') : undefined}
                                    chooseMode={IChooseTemplateMode.OnlyChildren}
                                    parentId={addRelationshipReferenceButtonProps}
                                    getInitialProperties={getInitialProperties}
                                >
                                    <AddIcon fontSize="small" />
                                    <Typography fontSize={14} style={{ fontWeight: '400', padding: '0 10px' }}>
                                        {i18next.t('location.newRequest')}
                                    </Typography>
                                </AddEntityButton>
                            </Grid>
                        )}
                    </Grid>
                );
            }),
        });
    }

    return columnDefs;
};
