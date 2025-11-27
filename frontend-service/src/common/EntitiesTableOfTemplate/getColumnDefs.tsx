import { ColDef, ValueGetterFunc } from '@ag-grid-community/core';
import { Add as AddIcon } from '@mui/icons-material';
import { Grid, Typography } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { memo } from 'react';
import { UseMutateAsyncFunction } from 'react-query';
import { Link } from 'wouter';
import { environment } from '../../globals';
import { IChildTemplateMap, IChildTemplatePopulated, IMongoChildTemplatePopulated } from '../../interfaces/childTemplates';
import { EntityData, IEntity } from '../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated, PropertyFormat } from '../../interfaces/entityTemplates';
import { IRuleBreach } from '../../interfaces/ruleBreaches/ruleBreach';
import { ISemanticSearchResult } from '../../interfaces/semanticSearch';
import { IGetUnits } from '../../interfaces/units';
import { IWorkspace } from '../../interfaces/workspaces';
import { CardMenu } from '../../pages/SystemManagement/components/CardMenu';
import { UserState } from '../../stores/user';
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
    unitColDef,
    userArrayColDef,
    userColDef,
} from '../../utils/agGrid/commonColDefs';
import { getChildrenWithWritePermission, isEntityFitsToChildTemplate } from '../../utils/childTemplates';
import { isWorkspaceAdmin } from '../../utils/permissions/instancePermissions';
import { isChildTemplate } from '../../utils/templates';
import { emptyEntityTemplate } from '../dialogs/entity';
import { IChooseTemplateMode } from '../dialogs/entity/ChooseTemplate';
import { AddEntityButton } from '../EntitiesPage/Buttons/AddEntity';
import { isUserHasWritePermissions } from '../EntitiesPage/TemplateTable';
import IconButtonWithPopover from '../IconButtonWithPopover';
import { ImageWithDisable } from '../ImageWithDisable';
import { ErrorResponseData } from '../PermissionsDialog/RoleDialog';
import { IButtonPopoverProps } from '.';

export interface IGetColumnDefsOptions<Data> {
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
    actionsColumnWidth?: number;
    darkMode: boolean;
    workspace: IWorkspace;
    childTemplatesOfParent?: IChildTemplatePopulated[];
    units: IGetUnits;
}

export const getColumnDefs = <Data = EntityData>({
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
    actionsColumnWidth = 200,
    darkMode,
    workspace,
    childTemplatesOfParent,
    units,
}: IGetColumnDefsOptions<Data>): ColDef[] => {
    const invisibleColumnsAmount = Object.values(defaultVisibleColumns).filter((value) => value === false).length;
    const lastColumnIndex = Object.keys(defaultColumnsOrder).length - invisibleColumnsAmount - 2;
    const firstTwoPropsOrder = template.propertiesOrder.slice(0, 2);

    const filteredProperties = template.propertiesOrder.filter(
        (propertyOrder) =>
            !template.properties.properties[propertyOrder]?.comment && template.properties.properties[propertyOrder]?.display !== false,
    );

    const getChildTemplateId = (entityId: string) =>
        childTemplatesOfParent?.find((child) =>
            isEntityFitsToChildTemplate(
                child,
                !template,
                entityId,
                currentUser?.kartoffelId,
                currentUser?.currentUnits,
                isWorkspaceAdmin(currentUser?.permissions?.[workspace._id]),
            ),
        );

    const columnDefs = filteredProperties.map((property) => {
        const propertyTemplate = { ...template.properties.properties[property] };
        const hiddenProperties = template.properties.hide;
        const { type, format, calculateTime, archive } = propertyTemplate;

        const isLastColumn = defaultColumnsOrder[property]?.order === lastColumnIndex;

        const hideField = template.properties.hide.includes(property);

        // Pass propertyToGet to extract a different property from the object
        const valueGetter = ({ data }, propertyToGet = property) => (data ? getEntityPropertiesData(data)[propertyToGet] : undefined);
        const entityGetter: ValueGetterFunc = ({ data }) => (data ? getEntityPropertiesData(data) : undefined);

        const isPreviewEmpty = template.propertiesPreview.length === 0;
        const isPropertyInPreview = template.propertiesPreview.includes(property);
        const isFirstTwoProperties = firstTwoPropsOrder.includes(property);
        const isDefaultVisibilityColumn = defaultVisibleColumns[property] !== undefined;
        const isColumnInDisplayList = columnsToShow?.includes(property) ?? true;

        const hideColumn = hideNonPreview
            ? isPreviewEmpty && hideNonPreview && !isFirstTwoProperties
            : archive ||
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
                ignoreType,
                searchValue,
                editable,
                propertyTemplate.relationshipReference!.filters,
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

        const isKartoffelImageRef = propertyTemplate.expandedUserField?.kartoffelField === 'image';
        if (propertyTemplate.format === 'user' || isKartoffelImageRef) {
            return userColDef(
                property,
                isKartoffelImageRef
                    ? (prop) => {
                          // TODO: use this method to get the properties of all related field?
                          const userField = propertyTemplate.expandedUserField?.relatedUserField;
                          return valueGetter(prop, userField);
                      }
                    : valueGetter,
                { title: propertyTemplate.title },
                [],
                defaultColumnWidths[property],
                isLastColumn,
                darkMode,
                hideColumn,
                {
                    shouldRenderChip: !isKartoffelImageRef,
                    ...(isKartoffelImageRef && { userIcon: { size: 34, overrideSx: { marginTop: '0.5rem' } } }),
                },
                ignoreType,
            );
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
                darkMode,
                ignoreType,
            );
        }

        if (propertyTemplate.format === 'unitField') {
            return unitColDef(
                property,
                propertyTemplate,
                units,
                defaultColumnWidths[property],
                isLastColumn,
                hideColumn,
                hideField,
                ignoreType,
                searchValue,
                editable,
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
                format: PropertyFormat['date-time'],
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
                format: PropertyFormat['date-time'],
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
            width: actionsColumnWidth,
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
                const childTemplateURLQuery = isChildTemplate(template)
                    ? `?childTemplateId=${getChildTemplateId(getEntityPropertiesData(data)._id!)?._id ?? template._id}`
                    : '';

                const destTemplate = addRelationshipReferenceButtonProps
                    ? (childEntityTemplateMap?.get(addRelationshipReferenceButtonProps) ??
                      entityTemplateMap?.get(addRelationshipReferenceButtonProps))
                    : undefined;

                const getInitialProperties = (relatedTemplate: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated): Record<string, any> => {
                    const relatedProperties = relatedTemplate.properties.properties ?? {};

                    return Object.entries(relatedProperties).reduce(
                        (acc, [key, prop]) => {
                            if (prop.relationshipReference?.relatedTemplateId === template._id) {
                                acc[key] = {
                                    templateId: template._id,
                                    properties: entity,
                                };
                            }
                            return acc;
                        },
                        {} as Record<string, any>,
                    );
                };

                return (
                    <Grid container flexWrap="nowrap">
                        {onNavigateToRow && (
                            <Grid>
                                <Link
                                    href={`/${pageType === environment.clientSideId ? `${environment.clientSideId}/entity` : 'entity'}/${
                                        getEntityPropertiesData(data)._id
                                    }${pageType === environment.clientSideId ? '' : childTemplateURLQuery}`}
                                    onClick={(e) => {
                                        if (!hasPermissionToTemplate) e.preventDefault();
                                    }}
                                    data-tour="entity-page"
                                >
                                    <IconButtonWithPopover
                                        popoverText={i18next.t(
                                            !hasPermissionToTemplate
                                                ? 'permissions.dontHavePermissionToEntityPage'
                                                : 'entitiesTableOfTemplate.navigateToEntityPage',
                                        )}
                                        disabled={!hasPermissionToTemplate}
                                    >
                                        <img src="/icons/read-more-icon.svg" alt="read-more" />
                                    </IconButtonWithPopover>
                                </Link>
                            </Grid>
                        )}
                        {deleteRowButtonProps && (
                            <Grid>
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
                            <Grid>
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
                            <Grid>
                                <Link
                                    href={`/entity/${getEntityPropertiesData(data)._id}/graph${childTemplateURLQuery}`}
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
                                        <img src="/icons/graph-icon.svg" alt="graph" />
                                    </IconButtonWithPopover>
                                </Link>
                            </Grid>
                        )}
                        {menuRowButtonProps && !template?.disabled && pageType !== environment.clientSideId && (
                            <Grid>
                                <CardMenu
                                    onDuplicateClick={() => {
                                        navigate(`/entity/${getRowId(data)}/duplicate${childTemplateURLQuery}`, {
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

                        {addRelationshipReferenceButtonProps && (
                            <Grid sx={{ display: 'flex', alignItems: 'center' }}>
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
