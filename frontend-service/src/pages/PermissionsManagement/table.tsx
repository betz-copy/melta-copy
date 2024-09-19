import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ColDef, ICellRendererParams, IServerSideDatasource, IServerSideGetRowsParams, ModuleRegistry } from '@ag-grid-community/core';
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
import React, { useMemo } from 'react';
import ScrollContainer from 'react-indiana-drag-scroll';
import { ServerSideRowModelModule } from '@noam7700/ag-grid-enterprise-server-side-row-model';
import { toast } from 'react-toastify';
import { environment } from '../../globals';
import { IMongoCategory } from '../../interfaces/categories';
import { PermissionScope } from '../../interfaces/permissions';
import { ICompact, IInstancesPermission } from '../../interfaces/permissions/permissions';
import { IUser } from '../../interfaces/users';
import { useWorkspaceStore } from '../../stores/workspace';
import { translatedEnumColDef } from '../../utils/agGrid/commonColDefs';
import { searchUsersRequest } from '../../services/userService';
import { trycatch } from '../../utils/trycatch';
import { IWorkspace } from '../../interfaces/workspaces';

const { defaultRowHeight } = environment.agGrid;
const { infiniteScrollPageCount } = environment.permission;

ModuleRegistry.registerModules([ServerSideRowModelModule]);

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
    },
    {
        field: 'externalMetadata.digitalIdentitySource',
        headerName: i18next.t('permissions.sourceHeaderName'),
        filter: 'agTextColumnFilter',
        hide: true,
    },
    translatedEnumColDef(
        'permissionsManagement',
        (params) => (params.data?.permissions[workspaceId]?.permissions?.scope || params.data?.permissions[workspaceId]?.admin?.scope) ?? '',
        { title: i18next.t('permissions.permissionsManagement') },
        scopesTranslation,
    ),
    translatedEnumColDef(
        'templatesManagement',
        (params) => (params.data?.permissions[workspaceId]?.templates?.scope || params.data?.permissions[workspaceId]?.admin?.scope) ?? '',
        { title: i18next.t('permissions.templatesManagement') },
        scopesTranslation,
    ),
    translatedEnumColDef(
        'rulesManagement',
        (params) => (params.data?.permissions[workspaceId]?.rules?.scope || params.data?.permissions[workspaceId]?.admin?.scope) ?? '',
        { title: i18next.t('permissions.rulesManagement') },
        scopesTranslation,
    ),
    translatedEnumColDef(
        'processesManagement',
        (params) => (params.data?.permissions[workspaceId]?.processes?.scope || params.data?.permissions[workspaceId]?.admin?.scope) ?? '',
        { title: i18next.t('permissions.processesManagement') },
        scopesTranslation,
    ),
    {
        field: 'categoriesPermissions',
        headerName: i18next.t('permissions.permissionsOfUserDialog.instancesPermissions'),
        valueGetter: (params) => params.data?.permissions[workspaceId].instances?.categories,
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

            const isAdmin = data?.permissions[workspaceId]?.admin?.scope === PermissionScope.write;

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

const getDatasource = <Data extends any = IUser>(
    { _id }: IWorkspace,
    quickFilter: string | undefined,
    onFail: (err: unknown) => void | undefined,
): IServerSideDatasource => {
    return {
        async getRows({ request: { startRow, endRow }, success, fail }: IServerSideGetRowsParams<Data>) {
            const { result: data, err } = await trycatch(() =>
                searchUsersRequest({
                    workspaceId: _id,
                    step: startRow! / infiniteScrollPageCount,
                    limit: endRow! - startRow!,
                    search: quickFilter || undefined,
                }),
            );

            if (err || !data) {
                onFail?.(err);
                fail();
                return;
            }
            success({
                rowData: data.users,
                rowCount: data.count,
            });
        },
    };
};

const getRowModelProps = <Data extends any = IUser>(
    workspace: IWorkspace,
    paginationPageSize: number,
    quickFilterText: string | undefined,
    datasourceOnFail: (err: unknown) => void,
): React.ComponentProps<typeof AgGridReact<Data>> => {
    return {
        rowModelType: 'serverSide',
        serverSideDatasource: getDatasource<IUser>(workspace, quickFilterText, datasourceOnFail),
        cacheBlockSize: infiniteScrollPageCount,
        maxBlocksInCache: infiniteScrollPageCount,
        pagination: true,
        paginationPageSize,
    };
};

export { getRowModelProps };

const Table: React.FC<{
    categories: IMongoCategory[];
    onDeletePermissionsOfUser: (permissionsOfUser: IUser) => any;
    onEditPermissionsOfUser: (permissionsOfUser: IUser) => any;
    quickFilterText: string;
}> = ({ categories, onDeletePermissionsOfUser, onEditPermissionsOfUser, quickFilterText }) => {
    const workspace = useWorkspaceStore((state) => state.workspace);

    const datasourceOnFail = (error) => {
        console.log('failed loading all users:', error);
        toast.error(i18next.t('permissions.failedToLoadAllPermissions'));
    };

    const rowModelProps = useMemo(
        () => getRowModelProps(workspace, infiniteScrollPageCount, quickFilterText, datasourceOnFail),
        [quickFilterText, workspace],
    );

    return (
        <AgGridReact<IUser>
            className="ag-theme-material"
            modules={[MenuModule, ColumnsToolPanelModule, SetFilterModule, ClientSideRowModelModule]}
            containerStyle={{ height: '780px', width: '100%', marginBottom: '30px', fontFamily: 'Rubik', fontSize: '16px', borderRadius: '70px' }}
            defaultColDef={defaultColDef}
            columnDefs={columnDefs(workspace._id, categories, onDeletePermissionsOfUser, onEditPermissionsOfUser)}
            getRowId={({ data: { _id } }) => _id}
            {...rowModelProps}
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
