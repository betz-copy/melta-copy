import React from 'react';
import i18next from 'i18next';
import '@noam7700/ag-grid-enterprise-core';
import { AgGridReact } from '@ag-grid-community/react';
import { ColDef, GetQuickFilterTextParams, ICellRendererParams, ISetFilterParams, ValueFormatterParams } from '@ag-grid-community/core';
import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-material.css';
import { Chip, Grid, IconButton } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { MenuModule } from '@noam7700/ag-grid-enterprise-menu';
import { SetFilterModule } from '@noam7700/ag-grid-enterprise-set-filter';
import ScrollContainer from 'react-indiana-drag-scroll';
import { IMongoCategory } from '../../interfaces/categories';
import { IPermissionsOfUser } from '../../services/permissionsService';
import { IUser } from '../../interfaces/users';
import { environment } from '../../globals';

const { defaultRowHeight } = environment.agGrid;

const defaultColDef: ColDef<IPermissionsOfUser> = {
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

const booleanToTextFormatter = (value: boolean) => (value ? i18next.t('booleanOptions.yes') : i18next.t('booleanOptions.no'));

const nullableStringToBooleanColDefs = (field: string, headerName: string): ColDef<IPermissionsOfUser> => {
    const filterParams: ISetFilterParams<IPermissionsOfUser, boolean> = {
        values: [true, false],
        suppressMiniFilter: true,
        suppressSelectAll: true,
        valueFormatter: (params: ValueFormatterParams<IPermissionsOfUser, boolean>) => booleanToTextFormatter(params.value),
    };

    return {
        colId: field, // used for autoSizeColumns onFirstDataRendered
        field,
        headerName,
        valueFormatter: (params) => booleanToTextFormatter(params.value),
        getQuickFilterText: (params) => booleanToTextFormatter(params.value),
        filter: 'agSetColumnFilter',
        filterValueGetter: (params) => Boolean(params.getValue(field)),
        filterParams,
        minWidth: undefined,
        flex: 0,
    };
};

const columnDefs = (
    categories: IMongoCategory[],
    onDeletePermissionsOfUser: (permissionsOfUser: IPermissionsOfUser) => any,
    onEditPermissionsOfUser: (permissionsOfUser: IPermissionsOfUser) => any,
): ColDef<IPermissionsOfUser>[] => [
    {
        field: 'user',
        headerName: i18next.t('permissions.userHeaderName'),
        valueFormatter: (params: ValueFormatterParams<IPermissionsOfUser, IPermissionsOfUser['user']>) => params.value.displayName,
        comparator: (userA: IUser, userB: IUser) => {
            const { displayName: userFullNameA } = userA;
            const { displayName: userFullNameB } = userB;
            return userFullNameA.localeCompare(userFullNameB);
        },
        filter: 'agTextColumnFilter',
        filterValueGetter: (params) => params.data!.user.displayName.toLowerCase(),
        getQuickFilterText: (params) => {
            const { id, displayName, digitalIdentities } = params.data.user;
            return `${id} ${displayName} ${digitalIdentities.map(({ uniqueId }) => uniqueId).join(' ')}`;
        },
    },
    nullableStringToBooleanColDefs('permissionsManagementId', i18next.t('permissions.permissionsManagement')),
    nullableStringToBooleanColDefs('templatesManagementId', i18next.t('permissions.templatesManagement')),
    nullableStringToBooleanColDefs('rulesManagementId', i18next.t('permissions.rulesManagement')),
    nullableStringToBooleanColDefs('processesManagementId', i18next.t('permissions.processesManagement')),
    {
        field: 'instancesPermissions',
        headerName: i18next.t('permissions.permissionsOfUserDialog.instancesPermissions'),
        getQuickFilterText: (params: GetQuickFilterTextParams<IPermissionsOfUser, IPermissionsOfUser['instancesPermissions']>) => {
            const permissionsOfCategories = params.value.map(({ category }) => {
                return (
                    categories.find(({ _id: currCategoryId }) => currCategoryId === category) ?? {
                        _id: category,
                        name: category,
                        displayName: category,
                    }
                );
            });
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
            instancesPermissionsLHS: IPermissionsOfUser['instancesPermissions'],
            instancesPermissionsRHS: IPermissionsOfUser['instancesPermissions'],
        ) => {
            if (instancesPermissionsLHS.length !== instancesPermissionsRHS.length) {
                return instancesPermissionsLHS.length > instancesPermissionsRHS.length ? 1 : -1;
            }

            // else, compare by categories ids (sorted in each). not important, just be deterministic
            const instancesPermissionsLHSStr = instancesPermissionsLHS
                .map(({ category }) => category)
                .sort()
                .join(',');
            const instancesPermissionsRHSStr = instancesPermissionsLHS
                .map(({ category }) => category)
                .sort()
                .join(',');

            return instancesPermissionsLHSStr.localeCompare(instancesPermissionsRHSStr);
        },
        cellRenderer: (props: ICellRendererParams<IPermissionsOfUser, IPermissionsOfUser['instancesPermissions']>) => {
            const instancesPermissionsPopulated = props.value.map(({ _id, category }) => {
                return {
                    _id,
                    category: categories.find(({ _id: currCategoryId }) => currCategoryId === category) ?? {
                        _id: category,
                        name: category,
                        displayName: category,
                    },
                };
            });

            // sort just for fun, same as comparator's sorting
            instancesPermissionsPopulated.sort((a, b) => a.category._id.localeCompare(b.category._id));

            return (
                <ScrollContainer horizontal vertical={false}>
                    <Grid container spacing={1} wrap="nowrap">
                        {instancesPermissionsPopulated.map(({ _id, category }) => (
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
        cellRenderer: (props: ICellRendererParams<IPermissionsOfUser>) => {
            const { data } = props;

            return (
                <div>
                    <IconButton color="primary" onClick={() => onEditPermissionsOfUser(data!)}>
                        <EditIcon />
                    </IconButton>
                    <IconButton color="primary" onClick={() => onDeletePermissionsOfUser(data!)}>
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
    permissionsOfUsers: IPermissionsOfUser[];
    categories: IMongoCategory[];
    onDeletePermissionsOfUser: (permissionsOfUser: IPermissionsOfUser) => any;
    onEditPermissionsOfUser: (permissionsOfUser: IPermissionsOfUser) => any;
    quickFilterText: string;
}> = ({ permissionsOfUsers, categories, onDeletePermissionsOfUser, onEditPermissionsOfUser, quickFilterText }) => {
    return (
        <AgGridReact<IPermissionsOfUser>
            className="ag-theme-material"
            modules={[MenuModule, SetFilterModule, ClientSideRowModelModule]}
            containerStyle={{ height: '780px', width: '100%', marginBottom: '30px', fontFamily: 'Rubik', fontSize: '16px', borderRadius: '70px' }}
            rowData={permissionsOfUsers}
            defaultColDef={defaultColDef}
            columnDefs={columnDefs(categories, onDeletePermissionsOfUser, onEditPermissionsOfUser)}
            rowModelType="clientSide"
            getRowId={({ data: permissionsOfUser }) => permissionsOfUser.user.id}
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
                    'permissionsManagementId',
                    'templatesManagementId',
                    'rulesManagementId',
                    'processesManagmentId',
                ]);
            }}
            quickFilterText={quickFilterText}
            localeText={i18next.t('agGridLocaleText', { returnObjects: true })}
            animateRows
        />
    );
};

export default Table;
