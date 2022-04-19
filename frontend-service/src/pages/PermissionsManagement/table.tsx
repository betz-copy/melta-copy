import React from 'react';
import i18next from 'i18next';

import '@noam7700/ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-material.css';

import { Chip, Grid, IconButton } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';

import { IMongoCategory } from '../../interfaces/categories';
import { IPermissionsOfUser } from '../../services/permissionsService';
import { IUser } from '../../services/kartoffelService';

const defaultColDef: ColDef = {
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

const nullableStringToBooleanColDefs = (field: string, headerName: string): ColDef => ({
    colId: field, // used for autoSizeColumns onFirstDataRendered
    field,
    headerName,
    valueFormatter: (params) => booleanToTextFormatter(params.value),
    getQuickFilterText: (params) => booleanToTextFormatter(params.value),
    filter: 'agSetColumnFilter',
    filterValueGetter: (params) => Boolean(params.getValue(field)),
    filterParams: {
        values: [true, false],
        suppressMiniFilter: true,
        suppressSelectAll: true,
        valueFormatter: (params: ValueFormatterParams) => booleanToTextFormatter(params.value === 'true'),
    },
    minWidth: undefined,
    flex: 0,
});

const columnDefs = (
    categories: IMongoCategory[],
    onDeletePermissionsOfUser: (permissionsOfUser: IPermissionsOfUser) => any,
    onEditPermissionsOfUser: (permissionsOfUser: IPermissionsOfUser) => any,
): ColDef[] => [
    {
        field: 'user',
        headerName: i18next.t('permissions.userHeaderName'),
        valueFormatter: (params) => params.value.displayName,
        comparator: (userA, userB) => {
            const { displayName: userFullNameA } = userA;
            const { displayName: userFullNameB } = userB;
            return userFullNameA.localeCompare(userFullNameB);
        },
        filter: 'agTextColumnFilter',
        filterValueGetter: (params) => (params.data.user.displayName as string).toLowerCase(),
        getQuickFilterText: (params) => {
            const { id, displayName, digitalIdentities } = params.data.user as IUser;
            return `${id} ${displayName} ${digitalIdentities.map(({ uniqueId }) => uniqueId).join(' ')}`;
        },
    },
    nullableStringToBooleanColDefs('permissionsManagementId', i18next.t('permissions.permissionsManagement')),
    nullableStringToBooleanColDefs('templatesManagementId', i18next.t('permissions.templatesManagement')),
    {
        field: 'instancesPermissions',
        headerName: i18next.t('permissions.permissionsOfUserDialog.instancesPermissions'),
        getQuickFilterText: (params) => {
            const permissionsOfCategories = (params.value as IPermissionsOfUser['instancesPermissions']).map(({ category }) => {
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
        cellRenderer: (props: ICellRendererParams) => {
            const instancesPermissions = props.value as IPermissionsOfUser['instancesPermissions'];
            const instancesPermissionsPopulated = instancesPermissions.map(({ _id, category }) => {
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
                <Grid container spacing={1} wrap="nowrap">
                    {instancesPermissionsPopulated.map(({ _id, category }) => (
                        <Grid item key={_id}>
                            <Chip label={category.displayName} />
                        </Grid>
                    ))}
                </Grid>
            );
        },
    },
    {
        headerName: '',
        colId: 'actions', // used for autoSizeColumns onFirstDataRendered
        sortable: false,
        filter: false,
        suppressMenu: true,
        cellRenderer: (props: ICellRendererParams) => {
            const { data } = props;

            return (
                <div>
                    <IconButton color="primary" onClick={() => onEditPermissionsOfUser(data)}>
                        <EditIcon />
                    </IconButton>
                    <IconButton color="primary" onClick={() => onDeletePermissionsOfUser(data)}>
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
        <AgGridReact
            className="ag-theme-material"
            containerStyle={{ height: '780px', width: '100%', marginBottom: '30px', fontFamily: 'Rubik', fontSize: '16px', borderRadius: '70px' }}
            rowData={permissionsOfUsers}
            defaultColDef={defaultColDef}
            columnDefs={columnDefs(categories, onDeletePermissionsOfUser, onEditPermissionsOfUser)}
            rowModelType="clientSide"
            getRowId={({ data: permissionsOfUser }) => (permissionsOfUser as IPermissionsOfUser).user.id}
            pagination
            paginationAutoPageSize
            rowHeight={50}
            rowStyle={{ alignItems: 'center' }}
            enableRtl
            enableCellTextSelection
            suppressMovableColumns
            suppressCsvExport
            suppressExcelExport
            suppressContextMenu
            onFirstDataRendered={(params) => {
                params.columnApi.autoSizeColumns(['actions', 'permissionsManagementId', 'templatesManagementId']);
            }}
            quickFilterText={quickFilterText}
            localeText={i18next.t('agGridLocaleText', { returnObjects: true })}
            animateRows
        />
    );
};

export default Table;
