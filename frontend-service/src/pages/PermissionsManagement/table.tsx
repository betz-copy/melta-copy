import { ColDef, ICellRendererParams, IServerSideDatasource, IServerSideGetRowsParams } from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { Chip, Grid, IconButton } from '@mui/material';
import i18next from 'i18next';
import React, { ForwardedRef, forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import ScrollContainer from 'react-indiana-drag-scroll';
import { toast } from 'react-toastify';
import { environment } from '../../globals';
import { IMongoCategory } from '../../interfaces/categories';
import { PermissionScope } from '../../interfaces/permissions';
import { ICompact, IInstancesPermission } from '../../interfaces/permissions/permissions';
import { IUser } from '../../interfaces/users';
import { IWorkspace } from '../../interfaces/workspaces';
import { searchUsersRequest } from '../../services/userService';
import { useDarkModeStore } from '../../stores/darkMode';
import { useWorkspaceStore } from '../../stores/workspace';
import { agGridLocaleText } from '../../utils/agGrid/agGridLocaleText';
import { translatedEnumColDef } from '../../utils/agGrid/commonColDefs';
import { trycatch } from '../../utils/trycatch';

const { defaultRowHeight } = environment.agGrid;
const { infiniteScrollPageCount } = environment.permission;

const scopesTranslation: Record<string, string> = i18next.t('permissions.scopes', { returnObjects: true });

const defaultColDef: ColDef<IUser> = {
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
    categories: IMongoCategory[],
    onDeletePermissionsOfUser: (permissionsOfUser: IUser) => any,
    onEditPermissionsOfUser: (permissionsOfUser: IUser) => any,
): ColDef[] => [
    {
        field: 'displayName',
        headerName: i18next.t('permissions.userHeaderName'),
        filter: 'agTextColumnFilter',
        sortable: true,
        suppressHeaderFilterButton: false,
    },
    {
        field: 'externalMetadata.digitalIdentitySource',
        headerName: i18next.t('permissions.sourceHeaderName'),
        filter: 'agTextColumnFilter',
        hide: true,
    },
    translatedEnumColDef<IUser>({
        field: 'permissionsManagement',
        valueGetter: (params) =>
            (params.data?.permissions[workspaceId]?.permissions?.scope || params.data?.permissions[workspaceId]?.admin?.scope) ?? '',
        title: i18next.t('permissions.permissionsManagement'),
        valuesMap: scopesTranslation,
    }),
    translatedEnumColDef<IUser>({
        field: 'templatesManagement',
        valueGetter: (params) =>
            (params.data?.permissions[workspaceId]?.templates?.scope || params.data?.permissions[workspaceId]?.admin?.scope) ?? '',
        title: i18next.t('permissions.templatesManagement'),
        valuesMap: scopesTranslation,
    }),
    translatedEnumColDef<IUser>({
        field: 'rulesManagement',
        valueGetter: (params) => (params.data?.permissions[workspaceId]?.rules?.scope || params.data?.permissions[workspaceId]?.admin?.scope) ?? '',
        title: i18next.t('permissions.rulesManagement'),
        valuesMap: scopesTranslation,
    }),
    translatedEnumColDef<IUser>({
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
        async getRows({ request, success, fail }: IServerSideGetRowsParams<Data>) {
            const { startRow, endRow, filterModel, sortModel } = request;

            const { result: data, err } = await trycatch(() =>
                searchUsersRequest({
                    workspaceIds: [_id],
                    step: startRow! / infiniteScrollPageCount,
                    limit: endRow! - startRow!,
                    search: quickFilter || undefined,
                    filterModel,
                    sortModel,
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

type PermissionsTableProps<Data> = {
    categories: IMongoCategory[];
    onDeletePermissionsOfUser: (permissionsOfUser: Data) => any;
    onEditPermissionsOfUser: (permissionsOfUser: Data) => any;
    quickFilterText: string;
};

export type PermissionsTableRef<Data> = {
    refreshServerSide: () => void;
    updateRowDataClientSide: (data: Data) => void;
};

const PermissionsTable = forwardRef<PermissionsTableRef<IUser>, PermissionsTableProps<IUser>>(
    ({ categories, onDeletePermissionsOfUser, onEditPermissionsOfUser, quickFilterText }, ref: ForwardedRef<PermissionsTableRef<IUser>>) => {
        const darkMode = useDarkModeStore((state) => state.darkMode);
        const workspace = useWorkspaceStore((state) => state.workspace);
        const gridRef = useRef<AgGridReact<IUser>>(null);

        const getRowId = ({ _id }) => _id;

        useImperativeHandle(ref, () => ({
            refreshServerSide() {
                gridRef.current?.api.refreshServerSide({ purge: true });
            },
            updateRowDataClientSide(data: IUser) {
                gridRef.current?.api.forEachNode((rowNode) => {
                    if (rowNode.data && getRowId(data) === getRowId(rowNode.data)) {
                        rowNode.updateData(data);
                    }
                });
            },
        }));

        const datasourceOnFail = (error: unknown) => {
            console.log('failed loading all users:', error);
            toast.error(i18next.t('permissions.failedToLoadAllPermissions'));
        };

        const rowModelProps = useMemo(
            () => getRowModelProps(workspace, infiniteScrollPageCount, quickFilterText, datasourceOnFail),
            [quickFilterText, workspace],
        );

        return (
            <AgGridReact<IUser>
                ref={gridRef}
                className={`ag-theme-material${darkMode ? '-dark' : ''}`}
                containerStyle={{ height: '780px', width: '100%', marginBottom: '30px', fontFamily: 'Rubik', fontSize: '16px', borderRadius: '70px' }}
                defaultColDef={defaultColDef}
                columnDefs={columnDefs(workspace._id, categories, onDeletePermissionsOfUser, onEditPermissionsOfUser)}
                getRowId={(params) => getRowId(params.data)}
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
                    params.api.autoSizeColumns([
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
                localeText={agGridLocaleText}
                animateRows
            />
        );
    },
);

export default PermissionsTable as <Data = IUser>(
    props: PermissionsTableProps<Data> & { ref?: React.ForwardedRef<PermissionsTableRef<Data>> },
) => ReturnType<typeof PermissionsTable>;
