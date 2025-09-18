import { ColDef, ICellRendererParams, IServerSideDatasource, ValueFormatterParams } from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import { ReadMore as ReadMoreIcon } from '@mui/icons-material';
import { Box, GlobalStyles } from '@mui/material';
import i18next from 'i18next';
import React, { forwardRef, memo, useImperativeHandle, useMemo, useRef } from 'react';
import { toast } from 'react-toastify';
import IconButtonWithPopover from '../../common/IconButtonWithPopover';
import '../../css/table.css';
import { ActionTypes } from '../../interfaces/ruleBreaches/actionMetadata';
import { BreachType, IRuleBreachPopulated } from '../../interfaces/ruleBreaches/ruleBreach';
import { IRuleBreachAlertPopulated } from '../../interfaces/ruleBreaches/ruleBreachAlert';
import { IRuleBreachRequestPopulated, RuleBreachRequestStatus } from '../../interfaces/ruleBreaches/ruleBreachRequest';
import { getRuleBreachAlertsRequest, getRuleBreachRequestsRequest } from '../../services/ruleBreachesService';
import { useDarkModeStore } from '../../stores/darkMode';
import { agGridLocaleText } from '../../utils/agGrid/agGridLocaleText';
import { dateColDef, enumArrayColDef, translatedEnumColDef } from '../../utils/agGrid/commonColDefs';
import { DateFilterComponent } from '../../utils/agGrid/DateFilterComponent';
import { trycatch } from '../../utils/trycatch';
import { useWorkspaceStore } from '../../stores/workspace';

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
    defaultRowHeight: number,
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
        suppressHeaderMenuButton: true,
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
            valueFormatter: (params) => params.value?.displayName,
            menuTabs: [],
            sortable: false,
        },
        enumArrayColDef<IRuleBreachPopulated>(
            'actionType',
            ({ data }) => data?.actions.map((action) => actionTypeTranslations[action.actionType]),
            { title: i18next.t('ruleManagement.actionType') },
            Object.values(actionTypeTranslations),
            400,
            defaultRowHeight,
            false,
        ),
        dateColDef<IRuleBreachPopulated>(
            'createdAt',
            ({ data }) => data?.createdAt,
            {
                title: i18next.t('ruleManagement.createdAt'),
                format: 'date-time',
            },
            true,
        ),
    ];

    const requestColDef: ColDef<IRuleBreachRequestPopulated>[] = [
        translatedEnumColDef<IRuleBreachRequestPopulated>({
            field: 'status',
            valueGetter: ({ data }) => data?.status,
            title: i18next.t('ruleManagement.approvalStatus'),
            valuesMap: {
                [RuleBreachRequestStatus.Approved]: i18next.t('ruleManagement.approved'),
                [RuleBreachRequestStatus.Denied]: i18next.t('ruleManagement.denied'),
                [RuleBreachRequestStatus.Pending]: i18next.t('ruleManagement.pending'),
                [RuleBreachRequestStatus.Canceled]: i18next.t('ruleManagement.canceled'),
            },
        }),
        {
            field: 'reviewer',
            headerName: i18next.t('ruleManagement.reviewer'),
            valueFormatter: (params: ValueFormatterParams<IRuleBreachRequestPopulated, IRuleBreachRequestPopulated['reviewer']>) =>
                params.value?.displayName ?? '',
            menuTabs: [],
            sortable: false,
        },
        dateColDef<IRuleBreachRequestPopulated>(
            'reviewedAt',
            ({ data }) => data?.reviewedAt,
            {
                title: i18next.t('ruleManagement.reviewedAt'),
                format: 'date-time',
            },
            true,
        ),
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
    const workspace = useWorkspaceStore((state) => state.workspace);
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const gridRef = useRef<AgGridReact>(null);
    const columnDefs: ColDef[] = getColumnDefs(workspace.metadata.agGrid.defaultRowHeight, breachType, onReviewBreachClick);

    const datasourceOnFail = (err: unknown) => {
        toast.error(i18next.t('entitiesTableOfTemplate.failedToLoadData'));
        console.error('failed to load data from datasource. err:', err);
    };

    const getGlobalStyles = () => {
        const styles = {
            '.ag-column-select-virtual-list-viewport': { height: `${rowHeight * pageRowCount}px !important` },
            '.ag-center-cols-viewport': { minHeight: `${rowHeight * pageRowCount}px !important` },
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
                className={`ag-theme-material${darkMode ? '-dark' : ''}`}
                ref={gridRef}
                containerStyle={{
                    width: '100%',
                    fontFamily: 'Rubik',
                    fontSize,
                    fontWeight: 300,
                }}
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
                    params.api.autoSizeColumns(['actions']);
                }}
                onGridReady={(params) => {
                    params.api.applyColumnState({ state: [{ colId: 'createdAt', sort: 'desc' }] });
                }}
                enableRtl
                enableCellTextSelection
                suppressCellFocus
                suppressCsvExport
                suppressContextMenu
                defaultColDef={{
                    filterParams: {
                        maxNumConditions: 1,
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
                localeText={agGridLocaleText}
                paginationPageSizeSelector={false}
            />
        </Box>
    );
});

export { RuleBreachTable };
