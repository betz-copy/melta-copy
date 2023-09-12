import React, { forwardRef, memo, useImperativeHandle, useMemo, useRef } from 'react';
import { Box, GlobalStyles } from '@mui/material';
import { ReadMore as ReadMoreIcon } from '@mui/icons-material';

import { ColDef, ICellRendererParams, IServerSideDatasource, ValueFormatterParams } from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import '@noam7700/ag-grid-enterprise-core';
import { ColumnsToolPanelModule } from '@noam7700/ag-grid-enterprise-column-tool-panel';
import { MenuModule } from '@noam7700/ag-grid-enterprise-menu';
import { SetFilterModule } from '@noam7700/ag-grid-enterprise-set-filter';
import { ServerSideRowModelModule } from '@noam7700/ag-grid-enterprise-server-side-row-model';
import i18next from 'i18next';
import { toast } from 'react-toastify';

import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-material.css';
import '../../css/table.css';

import { DateFilterComponent } from '../../utils/agGrid/DateFilterComponent';
import { trycatch } from '../../utils/trycatch';
import { getRuleBreachAlertsRequest, getRuleBreachRequestsRequest } from '../../services/ruleBreachesService';
import { dateColDef, translatedEnumColDef } from '../../utils/agGrid/commonColDefs';
import IconButtonWithPopover from '../../common/IconButtonWithPopover';
import { ActionTypes } from '../../interfaces/ruleBreaches/actionMetadata';
import { IRuleBreachAlertPopulated } from '../../interfaces/ruleBreaches/ruleBreachAlert';
import { IRuleBreachRequestPopulated, RuleBreachRequestStatus } from '../../interfaces/ruleBreaches/ruleBreachRequest';
import { BreachType, IRuleBreachPopulated } from '../../interfaces/ruleBreaches/ruleBreach';

const getDatasource = (breachType: BreachType, onFail: ((err: unknown) => void) | undefined): IServerSideDatasource => {
    return {
        async getRows(params) {
            const { sortModel, startRow, endRow, filterModel } = params.request;
            const { result: data, err } = await trycatch(() => {
                const searchRequest = breachType === 'alert' ? getRuleBreachAlertsRequest : getRuleBreachRequestsRequest;

                return searchRequest({
                    sortModel,
                    startRow,
                    endRow,
                    filterModel,
                });
            });

            if (err || !data) {
                onFail?.(err);
                params.fail();
                return;
            }

            params.success({ rowData: data.rows, rowCount: data.lastRowIndex });
        },
    };
};

const getColumnDefs = (
    breachType: BreachType,
    onReviewBreachClick: (ruleBreach: IRuleBreachAlertPopulated | IRuleBreachRequestPopulated, breachType: BreachType) => void,
) => {
    const cellPadding = 46;
    const iconButtonWidth = 42;
    const widthToFitButtons = cellPadding + iconButtonWidth;
    const headerNameWidth = 100;
    const columnWidth = Math.max(headerNameWidth, widthToFitButtons);

    const actionColDef: ColDef<IRuleBreachPopulated> = {
        headerName: i18next.t('ruleManagement.actionsHeaderName'),
        colId: 'actions',
        sortable: false,
        filter: false,
        suppressMenu: true,
        flex: 0,
        width: columnWidth,
        minWidth: columnWidth,
        cellRenderer: memo<ICellRendererParams>(({ data }) => {
            return (
                <IconButtonWithPopover
                    popoverText={i18next.t('ruleManagement.moreDetails')}
                    iconButtonProps={{
                        onClick: () => onReviewBreachClick(data, breachType),
                    }}
                >
                    <ReadMoreIcon
                        style={{
                            transform: 'scaleX(-1)',
                        }}
                    />
                </IconButtonWithPopover>
            );
        }),
    };

    const actionTypeTranslations = Object.fromEntries(
        Object.values(ActionTypes).map((action) => [action, i18next.t(`ruleManagement.${action}`) as string]),
    );

    const commonRuleBreachColumns: ColDef<IRuleBreachPopulated>[] = [
        {
            field: 'originUser',
            headerName: i18next.t('ruleManagement.originUser'),
            valueFormatter: (params) => params.value.displayName,
            menuTabs: [],
            sortable: false,
        },
        translatedEnumColDef('actionType', ({ data }) => data?.actionType, { title: i18next.t('ruleManagement.actionType') }, actionTypeTranslations),
        dateColDef('createdAt', ({ data }) => data?.createdAt, {
            title: i18next.t('ruleManagement.createdAt'),
            format: 'date-time',
        }),
    ];

    const requestColDef: ColDef<IRuleBreachRequestPopulated>[] = [
        translatedEnumColDef(
            'status',
            ({ data }) => data?.status,
            { title: i18next.t('ruleManagement.approvalStatus') },
            {
                [RuleBreachRequestStatus.Approved]: i18next.t('ruleManagement.approved'),
                [RuleBreachRequestStatus.Denied]: i18next.t('ruleManagement.denied'),
                [RuleBreachRequestStatus.Pending]: i18next.t('ruleManagement.pending'),
                [RuleBreachRequestStatus.Canceled]: i18next.t('ruleManagement.canceled'),
            },
        ),
        {
            field: 'reviewer',
            headerName: i18next.t('ruleManagement.reviewer'),
            valueFormatter: (params: ValueFormatterParams<IRuleBreachRequestPopulated, IRuleBreachRequestPopulated['reviewer']>) =>
                params.value?.displayName ?? '',
            menuTabs: [],
            sortable: false,
        },
        dateColDef('reviewedAt', ({ data }) => data?.reviewedAt, {
            title: i18next.t('ruleManagement.reviewedAt'),
            format: 'date-time',
        }),
    ];

    if (breachType === 'request') {
        return [...commonRuleBreachColumns, ...requestColDef, actionColDef];
    }

    return [...commonRuleBreachColumns, actionColDef];
};

const RuleBreachTable = forwardRef<
    { refreshBreaches: () => void },
    {
        rowHeight: number;
        pageRowCount?: number;
        fontSize: React.CSSProperties['fontSize'];
        minColumnWidth: number;
        breachType: BreachType;
        onReviewBreachClick: (ruleBreach: IRuleBreachAlertPopulated | IRuleBreachRequestPopulated, breachType: BreachType) => void;
    }
>(({ rowHeight, pageRowCount = 5, fontSize, minColumnWidth, breachType, onReviewBreachClick }, ref) => {
    const gridRef = useRef<AgGridReact>(null);
    const columnDefs: ColDef[] = getColumnDefs(breachType, onReviewBreachClick);

    const datasourceOnFail = (err: unknown) => {
        toast.error(i18next.t('entitiesTableOfTemplate.failedToLoadData'));
        // eslint-disable-next-line no-console
        console.log('failed to load data from datasource. err:', err);
    };

    const getGlobalStyles = () => {
        const styles = {
            '.ag-column-select-virtual-list-viewport': { height: `${rowHeight * pageRowCount}px !important` },
            '.ag-center-cols-clipper': { minHeight: `${rowHeight * pageRowCount}px !important` },
        };

        return styles;
    };

    useImperativeHandle(ref, () => ({
        refreshBreaches() {
            gridRef.current?.api.refreshServerSide({ purge: true });
        },
    }));

    const rowDataSource = useMemo(() => getDatasource(breachType, datasourceOnFail), [breachType]);

    return (
        <Box>
            <GlobalStyles styles={getGlobalStyles()} />
            <AgGridReact<IRuleBreachPopulated>
                className="ag-theme-material"
                ref={gridRef}
                containerStyle={{
                    width: '100%',
                    fontFamily: 'Rubik',
                    fontSize,
                    fontWeight: 300,
                }}
                modules={[ServerSideRowModelModule, ColumnsToolPanelModule, MenuModule, SetFilterModule]}
                domLayout="autoHeight"
                getRowId={({ data }) => data._id}
                columnDefs={columnDefs}
                rowModelType="serverSide"
                serverSideDatasource={rowDataSource}
                cacheBlockSize={10}
                maxBlocksInCache={1000}
                pagination
                paginationPageSize={pageRowCount}
                rowHeight={rowHeight}
                components={{
                    agDateInput: DateFilterComponent,
                }}
                onFirstDataRendered={(params) => {
                    params.columnApi.autoSizeColumns(['actions']);
                }}
                onGridReady={(params) => {
                    params.columnApi.applyColumnState({ state: [{ colId: 'createdAt', sort: 'desc' }] });
                }}
                enableRtl
                enableCellTextSelection
                suppressCellFocus
                suppressCsvExport
                suppressContextMenu
                defaultColDef={{
                    filterParams: {
                        suppressAndOrCondition: true,
                        buttons: ['reset'],
                    },
                    sortable: true,
                    menuTabs: ['filterMenuTab'],
                    minWidth: minColumnWidth,
                    resizable: true,
                    flex: 1,
                }}
                sideBar={{
                    toolPanels: [
                        {
                            id: 'columns',
                            labelDefault: 'Columns',
                            labelKey: 'columns',
                            iconKey: 'columns',
                            toolPanel: 'agColumnsToolPanel',
                            toolPanelParams: {
                                suppressRowGroups: true,
                                suppressValues: true,
                                suppressPivotMode: true,
                            },
                        },
                    ],
                    position: 'left',
                }}
                localeText={i18next.t('agGridLocaleText', { returnObjects: true })}
            />
        </Box>
    );
});

export { RuleBreachTable };
