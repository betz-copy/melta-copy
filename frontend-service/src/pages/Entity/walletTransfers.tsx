import { CellClassParams, ColDef, ICellRendererParams, ValueGetterParams } from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import { ArrowBack as ArrowBackIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { Avatar, Grid } from '@mui/material';
import i18next from 'i18next';
import React, { memo, useMemo, useRef } from 'react';
import { useQueryClient } from 'react-query';
import { Link } from 'wouter';
import AgGridTable from '../../common/agGridTable';
import IconButtonWithPopover from '../../common/IconButtonWithPopover';
import RelationshipReferenceView from '../../common/RelationshipReferenceView';
import { environment } from '../../globals';
import { IEntity, IEntityExpanded } from '../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { useUserStore } from '../../stores/user';
import { Value } from '../../utils/agGrid/Value';
import { isChildTemplate } from '../../utils/templates';
import { defaultColDef } from '../PermissionsManagement/components/table';
import { INestedRelationshipTemplates } from '.';

const { infiniteScrollPageCount } = environment.permission;

enum Direction {
    to = 'to',
    from = 'from',
    initial = 'initial',
}

export interface WalletTransferData {
    template: IMongoEntityTemplatePopulated;
    entity: IEntity;
    direction: Direction;
    balanceAtThatTime?: number;
    hasPermissionToRelatedTemplate?: boolean;
}

interface IWalletTransfers {
    templateId: string;
    expandedEntity: IEntityExpanded;
    connectionsTemplates?: INestedRelationshipTemplates[];
    getButtonStateByRelatedTemplate: (relatedTemplate: IMongoEntityTemplatePopulated) => {
        isEditButtonsDisabled: boolean;
        disabledButtonText: string;
        hasPermissionToRelatedTemplate: boolean;
    };
}

export type WalletTransferTableRef<TData = WalletTransferData> = {
    refreshServerSide: () => void;
    updateRowDataClientSide: (data: TData) => void;
};

export const WalletTransfers = ({ templateId, connectionsTemplates, expandedEntity, getButtonStateByRelatedTemplate }: IWalletTransfers) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const walletTransferTableRef = useRef<WalletTransferTableRef<WalletTransferData>>(null);

    const currentUser = useUserStore((state) => state.user);
    const isAdmin = Boolean(currentUser.currentWorkspacePermissions?.admin) || false;

    const currentTemplate = entityTemplates.get(expandedEntity.entity.templateId)!;
    const amountPropertyKey = Object.entries(currentTemplate.properties.properties).find(([_key, property]) => !!property.accountBalance)?.[0];
    const currentEntityBalance = expandedEntity.entity.properties[amountPropertyKey!] || 0;

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
            const relationshipTemplate = allTransfersConnectionsTemplates?.find(({ _id }) => _id === relTemplateId);

            if (!relationshipTemplate) return null;

            const { sourceEntity, destinationEntity } = connection;
            const sourceIsWallet = isWalletTemplate(relationshipTemplate.sourceEntity);

            const nonCurrentWalletEntity = sourceIsWallet ? destinationEntity : sourceEntity;
            const nonCurrentWalletTemplate = sourceIsWallet ? relationshipTemplate.destinationEntity : relationshipTemplate.sourceEntity;

            const createdAt = new Date(connection.relationship.properties.createdAt).getTime();
            const direction = sourceIsWallet ? Direction.to : Direction.from;

            const relatedTemplate = sourceIsWallet ? connection.destinationEntity : connection.sourceEntity;
            const populatedRelatedTemplate = entityTemplates.get(relatedTemplate.templateId)!;
            const { hasPermissionToRelatedTemplate } = getButtonStateByRelatedTemplate(populatedRelatedTemplate);

            return {
                template: nonCurrentWalletTemplate,
                entity: nonCurrentWalletEntity,
                direction,
                hasPermissionToRelatedTemplate,
                _sortKey: createdAt,
            };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => b._sortKey - a._sortKey)
        .map(({ _sortKey, ...rest }) => rest as WalletTransferData);

    const calculateBalancesFromCurrent = (transfers: WalletTransferData[], currentBalance: number): WalletTransferData[] => {
        let balance = currentBalance;

        const withBalances = transfers.map((t) => {
            const walletTransferAmountKey = t.template?.walletTransfer?.amount;
            const amount = Number(walletTransferAmountKey ? t.entity?.properties?.[walletTransferAmountKey] : 0);

            const rowWithBalance: WalletTransferData = {
                ...t,
                balanceAtThatTime: balance,
            };

            balance += t.direction === Direction.to ? amount : -amount;
            return rowWithBalance;
        });

        const initialRow: WalletTransferData = {
            template: {} as IMongoEntityTemplatePopulated,
            entity: expandedEntity.entity,
            direction: Direction.initial,
            balanceAtThatTime: balance,
        };

        return [...withBalances, initialRow];
    };

    const orderedConnectionEntitiesWithBalances = calculateBalancesFromCurrent(orderedConnectionEntities, currentEntityBalance);

    const getRowModelProps = (paginationPageSize: number): React.ComponentProps<typeof AgGridReact<WalletTransferData>> => {
        return {
            rowModelType: 'clientSide',
            rowData: orderedConnectionEntitiesWithBalances,
            pagination: true,
            paginationPageSize,
            domLayout: 'normal',
        };
    };

    const columnDefs: ColDef<WalletTransferData>[] = [
        {
            width: 60,
            sortable: false,
            filter: false,
            flex: 0,
            cellStyle: { display: 'flex', justifyContent: 'center' },
            cellRenderer: (params: ICellRendererParams<WalletTransferData>) => {
                if (params.data?.direction === Direction.initial) return null;
                const isWalletTo = params.data?.direction === Direction.to;
                const bgColor = isWalletTo ? '#fdd' : '#dfd';
                const arrowColor = isWalletTo ? 'red' : 'green';
                const sx = { fontSize: 16, color: arrowColor };

                return (
                    <Avatar sx={{ bgcolor: bgColor, width: 24, height: 24, m: 'auto' }}>
                        {isWalletTo ? <ArrowForwardIcon sx={sx} /> : <ArrowBackIcon sx={sx} />}
                    </Avatar>
                );
            },
        },
        {
            field: 'entity.properties.createdAt',
            headerName: i18next.t('entityPage.walletTransfer.createdAt'),
            valueGetter: (params: ValueGetterParams<WalletTransferData>) =>
                params.data?.entity?.properties?.createdAt ? new Date(params.data.entity.properties.createdAt).toLocaleString('en-GB') : '',
        },
        {
            headerName: i18next.t('entityPage.walletTransfer.entity'),
            valueGetter: (params: ValueGetterParams<WalletTransferData>) => {
                const data = params.data;
                if (!data || !data.template?.walletTransfer || data.direction === Direction.initial) return '';

                const directionKeyName = data.template.walletTransfer[data.direction];
                const templateField = data.template.properties.properties[directionKeyName];
                const fieldValue = data.entity.properties[directionKeyName];

                if (typeof fieldValue === 'string' && !templateField.enum) return fieldValue;

                return {
                    value: fieldValue,
                    isEnumField: !!templateField.enum,
                    direction: data.direction,
                    template: data.template,
                    entity: data.entity,
                };
            },
            cellRenderer: (props: ICellRendererParams) => {
                const value = props.value;
                if (!value) return '';
                if (typeof value === 'string') return <Value hideValue={false} value={value} />;

                if (value.isEnumField) {
                    const { value: enumValue, template, direction } = value;
                    const propertyKeyName = template.walletTransfer[direction];
                    return (
                        <Value
                            hideValue={false}
                            value={enumValue?.toString()}
                            enumColor={template.enumPropertiesColors?.[propertyKeyName]?.[enumValue] ?? 'default'}
                        />
                    );
                }

                const { entity, template, direction } = value;
                const relatedPropertyKey = template.walletTransfer[direction];
                const relatedEntity = entity.properties[relatedPropertyKey];
                const ref = template.properties.properties[relatedPropertyKey]?.relationshipReference;

                return ref ? (
                    <RelationshipReferenceView
                        entity={relatedEntity}
                        relatedTemplateId={ref.relatedTemplateId}
                        relatedTemplateField={ref.relatedTemplateField}
                    />
                ) : null;
            },
        },
        {
            headerName: i18next.t('entityPage.walletTransfer.description'),
            valueGetter: (params: ValueGetterParams<WalletTransferData>) => {
                if (!params.data) return '';
                const { direction, entity, template } = params.data;
                if (direction === Direction.initial) return i18next.t('entityPage.walletTransfer.initialBalanceDescription');
                return entity?.properties?.[template?.walletTransfer?.description || ''] ?? '';
            },
            cellRenderer: (params: ICellRendererParams) =>
                params.data?.direction === Direction.initial ? <strong>{params.value}</strong> : params.value,
        },
        {
            headerName: i18next.t('entityPage.walletTransfer.amount'),
            valueGetter: (params: ValueGetterParams<WalletTransferData>) => {
                if (!params.data) return '';
                const { direction, entity, balanceAtThatTime, template } = params.data;
                const amount =
                    direction === Direction.initial ? balanceAtThatTime : (entity?.properties?.[template.walletTransfer?.amount || ''] ?? '');
                const numAmount = Number(amount);
                if (direction === Direction.initial || numAmount < 0) return amount;
                return direction === Direction.to ? `${amount} -` : `${amount} +`;
            },
            cellStyle: (params: CellClassParams<WalletTransferData>) => ({
                color: params.data?.direction === Direction.to ? '#EA6466' : '#12B08A',
                fontWeight: 600,
            }),
        },
        {
            field: 'balanceAtThatTime',
            headerName: i18next.t('entityPage.walletTransfer.accountBalance'),
            valueFormatter: (p) => p.value?.toLocaleString(),
        },
        {
            headerName: i18next.t('entityPage.walletTransfer.actions'),
            width: 110,
            cellRenderer: memo<{ data: WalletTransferData }>(({ data }) => {
                if (!data.template || Object.keys(data.template).length === 0) return null;

                const hasPermissionToTemplate = Boolean(data.hasPermissionToRelatedTemplate) || isAdmin;
                const entityId = data.entity.properties._id;
                const entityLink = `/entity/${entityId}${isChildTemplate(data.template) ? `?childTemplateId=${data.template._id}` : ''}`;

                return (
                    <Grid container flexWrap="nowrap" justifyContent="center">
                        <Link href={entityLink} onClick={(e) => !hasPermissionToTemplate && e.preventDefault()}>
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
                );
            }),
        },
    ];

    // biome-ignore lint/correctness/useExhaustiveDependencies: re-render
    const rowModelProps = useMemo(() => getRowModelProps(infiniteScrollPageCount), [orderedConnectionEntitiesWithBalances]);

    return (
        <Grid sx={{ mt: '2rem' }}>
            <Grid container sx={{ marginTop: 2 }}>
                <AgGridTable
                    defaultColDef={defaultColDef as ColDef<WalletTransferData>}
                    getRowId={(data) => data.entity.properties._id}
                    rowModelProps={rowModelProps}
                    columnDefs={columnDefs}
                    ref={walletTransferTableRef}
                    height="600px"
                />
            </Grid>
        </Grid>
    );
};
