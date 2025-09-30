import { ColDef, ICellRendererParams, IServerSideDatasource, IServerSideGetRowsParams } from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { Chip, Grid, IconButton } from '@mui/material';
import i18next from 'i18next';
import React, { ForwardedRef, forwardRef, useMemo } from 'react';
import ScrollContainer from 'react-indiana-drag-scroll';
import { toast } from 'react-toastify';
import { environment } from '../../../globals';
import { IMongoCategory } from '../../../interfaces/categories';
import { PermissionScope } from '../../../interfaces/permissions';
import { IUser, PermissionData, RelatedPermission } from '../../../interfaces/users';
import { IWorkspace } from '../../../interfaces/workspaces';
import { searchRolesRequest, searchUsersRequest } from '../../../services/userService';
import { useWorkspaceStore } from '../../../stores/workspace';
import { translatedEnumColDef } from '../../../utils/agGrid/commonColDefs';
import { trycatch } from '../../../utils/trycatch';
import { ICompact, IInstancesPermission } from '../../../interfaces/permissions/permissions';
import { IRole } from '../../../interfaces/roles';
import AgGridTable from '../../../common/agGridTable';

const { infiniteScrollPageCount } = environment.permission;

const scopesTranslation = i18next.t('permissions.scopes', { returnObjects: true }) as Record<string, string>;

export const defaultColDef: ColDef<PermissionData> = {
    editable: false,
    sortable: false,
    flex: 1,
    minWidth: 100,
    filterParams: {
        maxNumConditions: 1,
        buttons: ['reset'],
    },
    resizable: true,
    menuTabs: ['filterMenuTab'],
    suppressHeaderMenuButton: false,
    suppressHeaderFilterButton: true,
};

const columnDefs = (
    workspaceId: string,
    permissionType: RelatedPermission,
    categories: IMongoCategory[],
    onDeletePermissions: (permissions: PermissionData) => any,
    onEditPermissions: (permissions: PermissionData) => any,
): ColDef[] => [
    {
        field: permissionType === RelatedPermission.User ? 'displayName' : 'name',
        headerName: i18next.t(`permissions.${permissionType === RelatedPermission.User ? 'userHeaderName' : 'roleHeaderName'}`),
        filter: 'agTextColumnFilter',
        sortable: true,
        suppressHeaderFilterButton: false,
    },
    ...(permissionType === RelatedPermission.User
        ? [
              {
                  field: 'name',
                  headerName: i18next.t('roleAutocomplete.label'),
                  valueGetter: (params) => (params.data.roles ?? []).find((role: IRole) => role.permissions[workspaceId])?.name ?? '',
                  filter: 'agTextColumnFilter',
                  sortable: true,
                  suppressHeaderFilterButton: false,
              } as ColDef,
          ]
        : []),
    translatedEnumColDef<PermissionData>({
        field: 'permissionsManagement',
        valueGetter: (params) =>
            (params.data?.permissions[workspaceId]?.permissions?.scope || params.data?.permissions[workspaceId]?.admin?.scope) ?? '',
        title: i18next.t('permissions.permissionsManagement'),
        valuesMap: scopesTranslation,
    }),
    translatedEnumColDef<PermissionData>({
        field: 'templatesManagement',
        valueGetter: (params) =>
            (params.data?.permissions[workspaceId]?.templates?.scope || params.data?.permissions[workspaceId]?.admin?.scope) ?? '',
        title: i18next.t('permissions.templatesManagement'),
        valuesMap: scopesTranslation,
    }),
    translatedEnumColDef<PermissionData>({
        field: 'rulesManagement',
        valueGetter: (params) => (params.data?.permissions[workspaceId]?.rules?.scope || params.data?.permissions[workspaceId]?.admin?.scope) ?? '',
        title: i18next.t('permissions.rulesManagement'),
        valuesMap: scopesTranslation,
    }),
    translatedEnumColDef<PermissionData>({
        field: 'processesManagement',
        valueGetter: (params) =>
            (params.data?.permissions[workspaceId]?.processes?.scope || params.data?.permissions[workspaceId]?.admin?.scope) ?? '',
        title: i18next.t('permissions.processesManagement'),
        valuesMap: scopesTranslation,
    }),
    {
        field: 'categoriesPermissions',
        headerName: i18next.t('permissions.permissionsOfUserDialog.instancesPermissions'),
        valueGetter: (params) => params.data?.permissions[workspaceId].instances?.categories,
        filter: false, // todo: do set filter with `.includes` logic
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
        cellRenderer: (props: ICellRendererParams<PermissionData, ICompact<IInstancesPermission>['categories']>) => {
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
                            <Grid key={_id}>
                                <Chip label={category.displayName} />
                            </Grid>
                        ))}
                    </Grid>
                </ScrollContainer>
            );
        },
        minWidth: 500,
    },
    {
        headerName: '',
        colId: 'actions', // used for autoSizeColumns onFirstDataRendered
        sortable: false,
        filter: false,
        suppressColumnsToolPanel: true,
        cellRenderer: (props: ICellRendererParams<PermissionData>) => {
            const { data } = props;

            const isAdmin = data?.permissions[workspaceId]?.admin?.scope === PermissionScope.write;

            return (
                <div>
                    <IconButton color="primary" onClick={() => onEditPermissions(data!)} disabled={isAdmin}>
                        <EditIcon />
                    </IconButton>
                    <IconButton color="primary" onClick={() => onDeletePermissions(data!)} disabled={isAdmin}>
                        <DeleteIcon />
                    </IconButton>
                </div>
            );
        },
        minWidth: undefined,
        flex: 0,
    },
];

const getDatasource = <Data extends any = PermissionData>(
    { _id }: IWorkspace,
    quickFilter: string | undefined,
    onFail: (err: unknown) => void | undefined,
    permissionType: RelatedPermission,
): IServerSideDatasource => {
    return {
        async getRows({ request, success, fail }: IServerSideGetRowsParams<Data>) {
            const { startRow, endRow, filterModel, sortModel } = request;
            let data: { dataArray?: IUser[] | IRole[]; count?: number }, error: unknown; //TODO: add types :)
            if (permissionType === RelatedPermission.User) {
                const { result, err } = await trycatch(() =>
                    searchUsersRequest({
                        workspaceIds: [_id],
                        step: startRow! / infiniteScrollPageCount,
                        limit: endRow! - startRow!,
                        search: quickFilter || undefined,
                        filterModel,
                        sortModel,
                    }),
                );
                data = { dataArray: result?.users, count: result?.count };
                error = err;
            } else {
                const { result, err } = await trycatch(() =>
                    searchRolesRequest({
                        workspaceIds: [_id],
                        step: startRow! / infiniteScrollPageCount,
                        limit: endRow! - startRow!,
                        search: quickFilter || undefined,
                        filterModel,
                        sortModel,
                    }),
                );
                data = { dataArray: result?.roles, count: result?.count };
                error = err;
            }

            if (error || !data.dataArray) {
                onFail?.(error);
                fail();
                return;
            }
            success({
                rowData: data.dataArray,
                rowCount: data.count,
            });
        },
    };
};

const getRowModelProps = <Data extends any = PermissionData>(
    workspace: IWorkspace,
    paginationPageSize: number,
    quickFilterText: string | undefined,
    datasourceOnFail: (err: unknown) => void,
    permissionType: RelatedPermission,
): React.ComponentProps<typeof AgGridReact<Data>> => {
    return {
        rowModelType: 'serverSide',
        serverSideDatasource: getDatasource<PermissionData>(workspace, quickFilterText, datasourceOnFail, permissionType),
        cacheBlockSize: infiniteScrollPageCount,
        maxBlocksInCache: infiniteScrollPageCount,
        pagination: true,
        paginationPageSize,
    };
};

type PermissionsTableProps<PermissionData> = {
    categories: IMongoCategory[];
    onDeletePermissions: (permissionsOfUser: PermissionData) => any;
    onEditPermissions: (permissionsOfUser: PermissionData) => any;
    quickFilterText: string;
    permissionType: RelatedPermission;
    getRowId: (data: PermissionData) => string;
};

export type PermissionsTableRef<PermissionData> = {
    refreshServerSide: () => void;
    updateRowDataClientSide: (data: PermissionData) => void;
};

const PermissionsTable = forwardRef<PermissionsTableRef<PermissionData>, PermissionsTableProps<PermissionData>>(
    (
        { permissionType, categories, onDeletePermissions, onEditPermissions, quickFilterText, getRowId },
        ref: ForwardedRef<PermissionsTableRef<PermissionData>>,
    ) => {
        const workspace = useWorkspaceStore((state) => state.workspace);

        const datasourceOnFail = (error: unknown) => {
            console.error('failed loading all users:', error);
            toast.error(i18next.t('permissions.failedToLoadAllPermissions'));
        };

        const rowModelProps = useMemo(
            () => getRowModelProps(workspace, infiniteScrollPageCount, quickFilterText, datasourceOnFail, permissionType),
            [quickFilterText, workspace],
        );

        return (
            <AgGridTable
                defaultColDef={defaultColDef}
                getRowId={getRowId}
                quickFilterText={quickFilterText}
                rowModelProps={rowModelProps}
                columnDefs={columnDefs(workspace._id, permissionType, categories, onDeletePermissions, onEditPermissions)}
                ref={ref}
            />
        );
    },
);

export default PermissionsTable as <Data = PermissionData>(
    props: PermissionsTableProps<Data> & { ref?: React.ForwardedRef<PermissionsTableRef<Data>> },
) => ReturnType<typeof PermissionsTable>;
