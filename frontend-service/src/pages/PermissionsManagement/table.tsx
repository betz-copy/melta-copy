import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ColDef, GetQuickFilterTextParams, ICellRendererParams } from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-material.css';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { Chip, Grid, IconButton } from '@mui/material';
import { ColumnsToolPanelModule } from '@noam7700/ag-grid-enterprise-column-tool-panel';
import '@noam7700/ag-grid-enterprise-core';
import { MenuModule } from '@noam7700/ag-grid-enterprise-menu';
import { SetFilterModule } from '@noam7700/ag-grid-enterprise-set-filter';
import i18next from 'i18next';
import React from 'react';
import ScrollContainer from 'react-indiana-drag-scroll';
import { environment } from '../../globals';
import { IMongoCategory } from '../../interfaces/categories';
import { PermissionScope } from '../../interfaces/permissions';
import { ICompact, IInstancesPermission } from '../../interfaces/permissions/permissions';
import { IUser } from '../../interfaces/users';
import { useWorkspaceStore } from '../../stores/workspace';
import { translatedEnumColDef } from '../../utils/agGrid/commonColDefs';

const { defaultRowHeight } = environment.agGrid;

const scopesTranslation: Record<string, string> = i18next.t('permissions.scopes', { returnObjects: true });

const defaultColDef: ColDef<IUser> = {
    editable: false,
    sortable: true,
    flex: 1,
    minWidth: 100,
    filterParams: {
        suppressAndOrCondition: true,
        buttons: ['reset'],
    },
    resizable: true,
    menuTabs: ['filterMenuTab'],
};

const columnDefs = (
    workspaceId: string,
    categories: IMongoCategory[],
    onDeletePermissionsOfUser: (permissionsOfUser: IUser) => any,
    onEditPermissionsOfUser: (permissionsOfUser: IUser) => any,
): ColDef<IUser>[] => [
    {
        field: 'displayName',
        headerName: i18next.t('permissions.userHeaderName'),
        filter: 'agTextColumnFilter',
        getQuickFilterText: (params) => {
            const {
                _id,
                displayName,
                externalMetadata: { digitalIdentitySource },
            } = params.data;

            return `${_id} ${displayName} ${digitalIdentitySource}`;
        },
    },
    {
        field: 'externalMetadata.digitalIdentitySource',
        headerName: i18next.t('permissions.sourceHeaderName'),
        filter: 'agTextColumnFilter',
        hide: true,
    },
    translatedEnumColDef(
        'permissionsManagement',
        (params) => (params.data?.permissions[workspaceId].permissions?.scope || params.data?.permissions[workspaceId].admin?.scope) ?? '',
        { title: i18next.t('permissions.permissionsManagement') },
        scopesTranslation,
    ),
    translatedEnumColDef(
        'templatesManagement',
        (params) => (params.data?.permissions[workspaceId].templates?.scope || params.data?.permissions[workspaceId].admin?.scope) ?? '',
        { title: i18next.t('permissions.templatesManagement') },
        scopesTranslation,
    ),
    translatedEnumColDef(
        'rulesManagement',
        (params) => (params.data?.permissions[workspaceId].rules?.scope || params.data?.permissions[workspaceId].admin?.scope) ?? '',
        { title: i18next.t('permissions.rulesManagement') },
        scopesTranslation,
    ),
    translatedEnumColDef(
        'processesManagement',
        (params) => (params.data?.permissions[workspaceId].processes?.scope || params.data?.permissions[workspaceId].admin?.scope) ?? '',
        { title: i18next.t('permissions.processesManagement') },
        scopesTranslation,
    ),
    {
        field: 'categoriesPermissions',
        headerName: i18next.t('permissions.permissionsOfUserDialog.instancesPermissions'),
        valueGetter: (params) => params.data?.permissions[workspaceId].instances?.categories,
        getQuickFilterText: (params: GetQuickFilterTextParams<IUser, ICompact<IInstancesPermission>['categories']>) => {
            const permissionsOfCategories =
                params.data?.permissions[workspaceId].admin?.scope === PermissionScope.write
                    ? Object.keys(params.value ?? {}).map((category) => {
                          return (
                              categories.find(({ _id: currCategoryId }) => currCategoryId === category) ?? {
                                  _id: category,
                                  name: category,
                                  displayName: category,
                              }
                          );
                      })
                    : categories;
            return permissionsOfCategories.map(({ displayName }) => displayName).join(' ');
        },
        filter: false, // todo: do set filter with `.includes` logic
        suppressMenu: true,
        // filter: 'agSetColumnFilter',
        // filterParams: {
        //     values: categories.map(({ _id }) => _id),
        //     valueFormatter: (params: ValueFormatterParams) => {
        //         const category = categories.find(({ _id }) => _id === params.value);
        //         return category!.displayName;
        //     },
        // },
        comparator: (
            categoriesPermissionsLHS: ICompact<IInstancesPermission>['categories'],
            categoriesPermissionsRHS: ICompact<IInstancesPermission>['categories'],
        ) => {
            const lhs = Object.keys(categoriesPermissionsLHS);
            const rhs = Object.keys(categoriesPermissionsRHS);

            if (lhs.length !== rhs.length) return lhs.length > rhs.length ? 1 : -1;

            // else, compare by categories ids (sorted in each). not important, just be deterministic
            return lhs.sort().join(',').localeCompare(rhs.sort().join(','));
        },
        cellRenderer: (props: ICellRendererParams<IUser, ICompact<IInstancesPermission>['categories']>) => {
            const categoriesPermissionsPopulated = Object.keys(props.value ?? {}).map((category) => {
                return {
                    _id: category,
                    category: categories.find(({ _id: currCategoryId }) => currCategoryId === category) ?? {
                        _id: category,
                        name: category,
                        displayName: category,
                    },
                };
            });

            // sort just for fun, same as comparator's sorting
            categoriesPermissionsPopulated.sort((a, b) => a.category._id.localeCompare(b.category._id));

            return (
                <ScrollContainer horizontal vertical={false}>
                    <Grid container spacing={1} wrap="nowrap">
                        {categoriesPermissionsPopulated.map(({ _id, category }) => (
                            <Grid item key={_id}>
                                <Chip label={category.displayName} />
                            </Grid>
                        ))}
                    </Grid>
                </ScrollContainer>
            );
        },
    },
    {
        headerName: '',
        colId: 'actions', // used for autoSizeColumns onFirstDataRendered
        sortable: false,
        filter: false,
        suppressMenu: true,
        suppressColumnsToolPanel: true,
        cellRenderer: (props: ICellRendererParams<IUser>) => {
            const { data } = props;

            const isAdmin = data?.permissions[workspaceId].admin?.scope === PermissionScope.write;

            return (
                <div>
                    <IconButton color="primary" onClick={() => onEditPermissionsOfUser(data!)} disabled={isAdmin}>
                        <EditIcon />
                    </IconButton>
                    <IconButton color="primary" onClick={() => onDeletePermissionsOfUser(data!)} disabled={isAdmin}>
                        <DeleteIcon />
                    </IconButton>
                </div>
            );
        },
        minWidth: undefined,
        flex: 0,
    },
];

const Table: React.FC<{
    users: IUser[];
    categories: IMongoCategory[];
    onDeletePermissionsOfUser: (permissionsOfUser: IUser) => any;
    onEditPermissionsOfUser: (permissionsOfUser: IUser) => any;
    quickFilterText: string;
}> = ({ users, categories, onDeletePermissionsOfUser, onEditPermissionsOfUser, quickFilterText }) => {
    const workspace = useWorkspaceStore((state) => state.workspace);

    return (
        <AgGridReact<IUser>
            className="ag-theme-material"
            modules={[MenuModule, ColumnsToolPanelModule, SetFilterModule, ClientSideRowModelModule]}
            containerStyle={{ height: '780px', width: '100%', marginBottom: '30px', fontFamily: 'Rubik', fontSize: '16px', borderRadius: '70px' }}
            rowData={users}
            defaultColDef={defaultColDef}
            columnDefs={columnDefs(workspace._id, categories, onDeletePermissionsOfUser, onEditPermissionsOfUser)}
            rowModelType="clientSide"
            getRowId={({ data: { _id } }) => _id}
            pagination
            paginationAutoPageSize
            rowHeight={defaultRowHeight}
            rowStyle={{ alignItems: 'center' }}
            enableRtl
            enableCellTextSelection
            suppressMovableColumns
            suppressCsvExport
            suppressExcelExport
            suppressContextMenu
            onFirstDataRendered={(params) => {
                params.columnApi.autoSizeColumns([
                    'actions',
                    'displayName',
                    'source',
                    'permissionsManagement',
                    'templatesManagement',
                    'rulesManagement',
                    'processesManagement',
                    'categoriesPermissions',
                ]);
            }}
            sideBar={{
                toolPanels: [
                    {
                        id: 'columns',
                        labelDefault: 'Columns',
                        labelKey: 'columns',
                        iconKey: 'columns',
                        toolPanel: 'agColumnsToolPanel',
                        toolPanelParams: { suppressRowGroups: true, suppressValues: true, suppressPivotMode: true },
                    },
                ],
                position: 'left',
            }}
            quickFilterText={quickFilterText}
            localeText={i18next.t('agGridLocaleText', { returnObjects: true })}
            animateRows
        />
    );
};

export default Table;
