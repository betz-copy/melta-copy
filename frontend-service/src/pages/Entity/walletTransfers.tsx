import { AgGridReact } from '@ag-grid-community/react';
import i18next from 'i18next';
import React, { ForwardedRef, memo, useMemo, useRef } from 'react';
import { INestedRelationshipTemplates } from '.';
import AgGridTable from '../../common/agGridTable';
import { environment } from '../../globals';
import { IEntity, IEntityExpanded } from '../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { defaultColDef } from '../PermissionsManagement/components/table';
import { Avatar, Box, Grid, Typography } from '@mui/material';
import { Link } from 'wouter';
import IconButtonWithPopover from '../../common/IconButtonWithPopover';
import { isChildTemplate } from '../../utils/templates';
import { useQueryClient } from 'react-query';
import { useUserStore } from '../../stores/user';
import { ArrowForward as ArrowForwardIcon, ArrowBack as ArrowBackIcon, AccountBalanceWalletOutlined } from '@mui/icons-material';
import { Value } from '../../utils/agGrid/Value';
import RelationshipReferenceView from '../../common/RelationshipReferenceView';

const { infiniteScrollPageCount } = environment.permission;

interface WalletTransferData {
    template: IMongoEntityTemplatePopulated;
    entity: IEntity;
    direction: string;
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


export type WalletTransferTableRef<WalletTransferData> = {
    refreshServerSide: () => void;
    updateRowDataClientSide: (data: WalletTransferData) => void;
};

export const WalletTransfers: React.FC<IWalletTransfers> = ({
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
        hasPermissionToRelatedTemplate: boolean;
    };
}) => {
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

            const relationshipTemplate = allTransfersConnectionsTemplates?.find((t) => t._id === relTemplateId);
            if (!relationshipTemplate) return null;

            const { sourceEntity, destinationEntity } = connection;

            const sourceIsWallet = isWalletTemplate(relationshipTemplate.sourceEntity);

            const nonCurrentWalletEntity = sourceIsWallet ? destinationEntity : sourceEntity;
            const nonCurrentWalletTemplate = sourceIsWallet ? relationshipTemplate.destinationEntity : relationshipTemplate.sourceEntity;

            const createdAt = new Date((connection.relationship.properties as any).createdAt).getTime();
            const direction = sourceIsWallet ? 'to' : 'from';

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
        .map(({ _sortKey, ...rest }) => rest);

    function calculateBalancesFromCurrent(transfers: WalletTransferData[], currentBalance: number) {
        let balance = currentBalance;

        const withBalances: WalletTransferData[] = transfers.map((t) => {
            const walletTransferAmountKey = t.template?.walletTransfer?.amount;
            const amount = Number(walletTransferAmountKey ? t.entity?.properties?.[walletTransferAmountKey] : 0);

            const rowWithBalance = {
                ...t,
                balanceAtThatTime: balance,
            };

            balance += t.direction === 'to' ? amount : -amount;

            return rowWithBalance;
        });

        const initialRow: WalletTransferData = {
            template: {} as IMongoEntityTemplatePopulated,
            entity: expandedEntity.entity,
            direction: 'initial',
            balanceAtThatTime: balance,
        } as WalletTransferData;

        return [...withBalances, initialRow];
    }

    const orderedConnectionEntitiesWithBalances = calculateBalancesFromCurrent(orderedConnectionEntities, currentEntityBalance);

    const getRowModelProps = <Data extends any = WalletTransferData>(paginationPageSize: number): React.ComponentProps<typeof AgGridReact<Data>> => {
        return {
            rowModelType: 'clientSide',
            rowData: orderedConnectionEntitiesWithBalances as Data[],
            pagination: true,
            paginationPageSize,
        };
    };

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
        },
        {
            field: 'transfer.entity',
            headerName: i18next.t('entityPage.walletTransfer.entity'),
            valueGetter: (params: any) => {
                const { entity, template, direction } = params.data;
                if (!template.walletTransfer) return '';

                const directionKeyName = template.walletTransfer[direction];
                const templateField = template.properties.properties[directionKeyName];
                const fieldValue = entity.properties[directionKeyName];
                const isEnumField = !!templateField.enum;

                if (typeof fieldValue === 'string' && !isEnumField) {
                    return fieldValue;
                }

                if (isEnumField) {
                    return {
                        value: fieldValue,
                        isEnumField: true,
                        direction,
                        template,
                    };
                }

                return params.data;
            },
            cellRenderer: (props: any) => {
                const value = props.value;

                if (typeof value === 'string') {
                    return <Value hideValue={false} value={value} />;
                }

                if (value?.isEnumField) {
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
                const { relatedTemplateField, relatedTemplateId } = template.properties.properties[relatedPropertyKey].relationshipReference;

                return (
                    <RelationshipReferenceView
                        entity={relatedEntity}
                        relatedTemplateId={relatedTemplateId}
                        relatedTemplateField={relatedTemplateField}
                    />
                );
            },
        },
        {
            field: 'transfer.description',
            headerName: i18next.t('entityPage.walletTransfer.description'),
            valueGetter: (params: any) => params.data?.entity?.properties[params.data?.template.walletTransfer?.description] ?? '',
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
        },
        {
            field: 'balanceAtThatTime',
            headerName: i18next.t('entityPage.walletTransfer.accountBalance'),
            valueFormatter: (p) => p.value?.toLocaleString(),
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

                if (Object.keys(data.template || {}).length === 0) return;

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
        },
    ];

    const rowModelProps = useMemo(() => getRowModelProps(infiniteScrollPageCount), []);

    return (
        <Grid data-tour="connected-entities" sx={{ mt: '2rem' }}>
            <Grid
                container
                alignItems="center"
                gap="10px"
                sx={{
                    backgroundColor: '#CCCFE580',
                    borderRadius: '20px 20px 0px 0px',
                    px: 2,
                    py: 0.8,
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        color: '#1E2775',
                        fontWeight: 600,
                        fontSize: '18px',
                        paddingLeft: '55px',
                    }}
                >
                    {i18next.t('entityPage.walletTransfersTitle')}
                </Typography>
            </Grid>
            <Box
                sx={{
                    backgroundColor: '#4752B6',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    mt: '-25px',
                    ml: 1.5,
                }}
            >
                <AccountBalanceWalletOutlined sx={{ color: '#FFFFFF', fontSize: '22px' }} />
            </Box>
            <Grid container sx={{ marginTop: 2 }}>
                <AgGridTable
                    defaultColDef={defaultColDef as any}
                    getRowId={(data: any) => data.entity._id}
                    rowModelProps={rowModelProps}
                    columnDefs={columnDefs}
                    ref={walletTransferTableRef as ForwardedRef<WalletTransferTableRef<WalletTransferData>>}
                />
            </Grid>
        </Grid>
    );
};
