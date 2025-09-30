import { AgGridReact } from '@ag-grid-community/react';
import i18next from 'i18next';
import React, { ForwardedRef, memo, useMemo, useRef } from 'react';
import { INestedRelationshipTemplates } from '.';
import AgGridTable from '../../common/agGridTable';
import { environment } from '../../globals';
import { IEntity, IEntityExpanded } from '../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { defaultColDef } from '../PermissionsManagement/components/table';
import { Avatar, Grid, Typography } from '@mui/material';
import { Link } from 'wouter';
import IconButtonWithPopover from '../../common/IconButtonWithPopover';
import { isChildTemplate } from '../../utils/templates';
import { useQueryClient } from 'react-query';
import { useUserStore } from '../../stores/user';
import { ArrowForward as ArrowForwardIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const { infiniteScrollPageCount } = environment.permission;

interface WalletTransferData {
    template: IMongoEntityTemplatePopulated;
    entity: IEntity;
    direction: string;
}

export type WalletTransferTableRef<WalletTransferData> = {
    refreshServerSide: () => void;
    updateRowDataClientSide: (data: WalletTransferData) => void;
};

export const WalletTransfers: React.FC<any> = ({
    templateId,
    connectionsTemplates,
    expandedEntity,
    getButtonStateByRelatedTemplate,
}: {
    templateId: string;
    expandedEntity: IEntityExpanded;
    connectionsTemplates?: INestedRelationshipTemplates[];
    getButtonStateByRelatedTemplate: (relatedTemplate: IMongoEntityTemplatePopulated) => {
        isEditButtonsDisabled: boolean;
        disabledButtonText: string;
        permissionToRelatedTemplate: boolean;
    };
}) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const walletTransferTableRef = useRef<WalletTransferTableRef<WalletTransferData>>(null);

    // const datasourceOnFail = (error: unknown) => {
    //     console.error('failed loading all users:', error);
    //     toast.error(i18next.t('permissions.failedToLoadAllPermissions'));

    // };
    const currentUser = useUserStore((state) => state.user);
    const isAdmin = Boolean(currentUser.currentWorkspacePermissions?.admin) || false;

    const currentTemplate = entityTemplates.get(expandedEntity.entity.templateId)!;
    const amountPropertyKey = Object.entries(currentTemplate.properties.properties).find(([_key, property]) => !!property.accountBalance)?.[0];
    const currentEntityBalance = expandedEntity.entity.properties[amountPropertyKey!] || 0;

    console.log({ currentEntityBalance });

    const allTransfersConnectionsTemplates = connectionsTemplates
        ?.filter(({ relationshipTemplate }) => {
            const { destinationEntity, sourceEntity } = relationshipTemplate;
            return !!destinationEntity.walletTransfer || !!sourceEntity.walletTransfer;
        })
        .map(({ relationshipTemplate }) => relationshipTemplate);

    const isWalletTemplate = (entityTemplate: IMongoEntityTemplatePopulated) =>
        !!Object.values(entityTemplate.properties.properties).find((property) => !!property.accountBalance) && entityTemplate._id === templateId;

    const orderedConnectionEntities: WalletTransferData[] = expandedEntity.connections
        .map((connection) => {
            const relTemplateId = connection.relationship.templateId;

            const relationshipTemplate = allTransfersConnectionsTemplates?.find((t) => t._id === relTemplateId);
            if (!relationshipTemplate) return null;

            const { sourceEntity, destinationEntity } = connection;

            const sourceIsWallet = isWalletTemplate(relationshipTemplate.sourceEntity);

            const nonCurrentWalletEntity = sourceIsWallet ? destinationEntity : sourceEntity;
            const nonCurrentWalletTemplate = sourceIsWallet ? relationshipTemplate.destinationEntity : relationshipTemplate.sourceEntity;
            console.log({ sourceIsWallet, relationshipTemplate });

            const createdAt = new Date((connection.relationship.properties as any).createdAt).getTime();
            const direction = sourceIsWallet ? 'to' : 'from';

            const relatedTemplate = sourceIsWallet ? connection.destinationEntity : connection.sourceEntity;
            const populatedRelatedTemplate = entityTemplates.get(relatedTemplate.templateId)!;
            const { permissionToRelatedTemplate } = getButtonStateByRelatedTemplate(populatedRelatedTemplate);

            return {
                template: nonCurrentWalletTemplate,
                entity: nonCurrentWalletEntity,
                direction,
                permissionToRelatedTemplate,
                _sortKey: createdAt,
            };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => b._sortKey - a._sortKey)
        .map(({ _sortKey, ...rest }) => rest);

    const getRowModelProps = <Data extends any = WalletTransferData>(paginationPageSize: number): React.ComponentProps<typeof AgGridReact<Data>> => {
        return {
            rowModelType: 'clientSide',
            rowData: orderedConnectionEntities as Data[],
            pagination: true,
            paginationPageSize,
        };
    };
    let runningBalance = 0;

    const columnDefs = [
        {
            width: 10,
            sortable: false,
            filter: false,
            flex: 0,
            cellStyle: {
                display: 'flex',
                justifyContent: 'center',
            },
            cellRenderer: (params: any) => {
                const isWalletSource = params.data?.direction === 'to';
                const bgColor = isWalletSource ? '#fdd' : '#dfd';
                const arrowColor = isWalletSource ? 'red' : 'green';

                return (
                    <Avatar
                        sx={{
                            bgcolor: bgColor,
                            width: 24,
                            height: 24,
                            m: 'auto',
                        }}
                    >
                        {isWalletSource ? (
                            <ArrowForwardIcon sx={{ fontSize: 16, color: arrowColor }} />
                        ) : (
                            <ArrowBackIcon sx={{ fontSize: 16, color: arrowColor }} />
                        )}
                    </Avatar>
                );
            },
        },
        {
            field: 'createdAt',
            headerName: i18next.t('entityPage.walletTransfer.createdAt'),
            valueGetter: (params: any) =>
                params.data?.entity.properties.createdAt ? new Date(params.data.entity.properties.createdAt).toLocaleString() : '',
            filter: 'agDateColumnFilter',
        },
        {
            field: 'transfer.entity',
            headerName: i18next.t('entityPage.walletTransfer.entity'),
            valueGetter: (params: any) => params.data?.entity.properties[params.data?.template.walletTransfer[params.data?.direction]] ?? '',
            filter: 'agTextColumnFilter',
        },
        {
            field: 'transfer.description',
            headerName: i18next.t('entityPage.walletTransfer.description'),
            valueGetter: (params: any) => params.data?.entity?.properties[params.data?.template.walletTransfer?.description] ?? '',
            filter: 'agTextColumnFilter',
        },
        {
            field: 'transfer.amount',
            headerName: i18next.t('entityPage.walletTransfer.amount'),
            valueGetter: (params: any) => {
                const amount = params.data?.entity?.properties?.[params.data?.template.walletTransfer?.amount] ?? '';
                return params.data?.direction === 'to' ? `${amount} -` : `${amount} +`;
            },
            cellStyle: (params: any) => ({
                color: params.data?.direction === 'to' ? '#EA6466' : '#12B08A',
                fontWeight: 600,
            }),
            filter: 'agTextColumnFilter',
        },
        {
            field: 'transfer.accountBalance',
            headerName: i18next.t('entityPage.walletTransfer.accountBalance'),
            valueGetter: (params) => {
                // Reset on the first (newest) row
                if (params.node.rowIndex === 0) {
                    runningBalance = Number(currentEntityBalance);
                }

                const amount = Number(params.data?.entity?.properties?.[params.data?.template.walletTransfer?.amount] ?? 0);

                // Because we move backward in time, *reverse* the math:
                // If money came in ("from" wallet → +), we need to ADD it back to go to the previous state.
                // If money went out ("to" wallet → -), we need to SUBTRACT it back.
                runningBalance += params.data?.direction === 'to' ? +amount : -amount;

                return runningBalance.toLocaleString();
            },
            filter: 'agTextColumnFilter',
        },
        {
            field: 'transfer.actions',
            headerName: i18next.t('entityPage.walletTransfer.actions'),
            width: 110,
            flex: 0,
            resizable: false,
            lockPosition: true,
            lockPinned: true,
            suppressColumnsToolPanel: true,
            cellStyle: {
                display: 'flex',
                justifyContent: 'center',
            },
            cellRenderer: memo<{ data: any }>(({ data }) => {
                const { permissionToRelatedTemplate } = data;
                const hasPermissionToTemplate = Boolean(permissionToRelatedTemplate) || isAdmin;

                const entityId = data.entity.properties._id;
                const entityLink = `/entity/${entityId}${isChildTemplate(data.template) ? `?childTemplateId=${data.template._id}` : ''}`;
                console.log({ data });

                return (
                    <Grid container flexWrap="nowrap">
                        <Grid>
                            <Link
                                href={entityLink}
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
                                    <img src="/icons/read-more-icon.svg" alt="read more" />
                                </IconButtonWithPopover>
                            </Link>
                        </Grid>
                    </Grid>
                );
            }),
            filter: 'agTextColumnFilter',
        },
    ];

    const rowModelProps = useMemo(() => getRowModelProps(infiniteScrollPageCount), []);

    return (
        <AgGridTable
            defaultColDef={defaultColDef as any}
            getRowId={(data: any) => data.entity._id}
            // quickFilterText={quickFilterText}
            rowModelProps={rowModelProps}
            columnDefs={columnDefs}
            ref={walletTransferTableRef as ForwardedRef<WalletTransferTableRef<WalletTransferData>>}
        />
    );
};
