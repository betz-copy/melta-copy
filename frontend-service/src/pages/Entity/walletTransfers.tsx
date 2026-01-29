import { CellClassParams, ColDef, ICellRendererParams, ValueGetterParams } from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import {
    AccountBalanceWalletOutlined,
    AddCircle,
    ArrowBack as ArrowBackIcon,
    ArrowForward as ArrowForwardIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { Autocomplete, Avatar, Box, Card, CardContent, Dialog, Grid, IconButton, TextField, Typography, useTheme } from '@mui/material';
import { ActionTypes } from '@packages/action';
import { isChildTemplate } from '@packages/child-template';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated, IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import i18next from 'i18next';
import React, { memo, useMemo, useRef, useState } from 'react';
import { useQueryClient } from 'react-query';
import { Link } from 'wouter';
import AgGridTable from '../../common/agGridTable';
import { CreateOrEditEntityDetails } from '../../common/dialogs/entity/CreateOrEditEntityDialog';
import IconButtonWithPopover from '../../common/IconButtonWithPopover';
import BlueTitle from '../../common/MeltaDesigns/BlueTitle';
import RelationshipReferenceView from '../../common/RelationshipReferenceView';
import { environment } from '../../globals';
import { ICreateOrUpdateWithRuleBreachDialogState } from '../../interfaces/CreateOrEditEntityDialog';
import { Direction, IEntityTemplateMap, ITemplate, IWalletTransfers, WalletTransferData } from '../../interfaces/template';
import { useUserStore } from '../../stores/user';
import { Value } from '../../utils/agGrid/Value';
import { defaultColDef } from '../PermissionsManagement/components/table';

const { infiniteScrollPageCount } = environment.permission;

export type WalletTransferTableRef<TData = WalletTransferData> = {
    refreshServerSide: () => void;
    updateRowDataClientSide: (data: TData) => void;
};

export const WalletTransfers = ({ templateId, connectionsTemplates, expandedEntity, getButtonStateByRelatedTemplate }: IWalletTransfers) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const walletTransferTableRef = useRef<WalletTransferTableRef<WalletTransferData>>(null);
    const theme = useTheme();

    const currentUser = useUserStore((state) => state.user);
    const isAdmin = Boolean(currentUser.currentWorkspacePermissions?.admin) || false;

    const currentTemplate = entityTemplates.get(expandedEntity.entity.templateId)!;
    const amountPropertyKey = Object.entries(currentTemplate.properties.properties).find(
        ([_key, property]) => !!(property as IEntitySingleProperty).accountBalance,
    )?.[0];
    const currentEntityBalance = expandedEntity.entity.properties[amountPropertyKey!] || 0;

    const allTransfersConnectionsTemplates = connectionsTemplates
        ?.filter(({ relationshipTemplate }) => {
            const { destinationEntity, sourceEntity } = relationshipTemplate;
            return !!destinationEntity.walletTransfer || !!sourceEntity.walletTransfer;
        })
        .map(({ relationshipTemplate }) => relationshipTemplate);

    // Get all transfer templates that can be used to create a new transfer from/to this wallet
    const transferTemplates = useMemo(() => {
        return Array.from(entityTemplates.values()).filter((template) => {
            if (!template.walletTransfer || template.disabled) return false;

            const { walletTransfer, properties } = template;
            const fromProperty = properties.properties[walletTransfer.from];
            const toProperty = properties.properties[walletTransfer.to];

            const fromRelatedTemplateId = fromProperty?.relationshipReference?.relatedTemplateId;
            const toRelatedTemplateId = toProperty?.relationshipReference?.relatedTemplateId;

            return fromRelatedTemplateId === templateId || toRelatedTemplateId === templateId;
        });
    }, [entityTemplates, templateId]);

    const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);
    const [selectedTransferTemplate, setSelectedTransferTemplate] = useState<IMongoEntityTemplatePopulated | null>(null);
    const [externalErrors, setExternalErrors] = useState({ files: false, unique: {}, action: '' });
    const [createOrUpdateWithRuleBreachDialogState, setCreateOrUpdateWithRuleBreachDialogState] = useState<ICreateOrUpdateWithRuleBreachDialogState>({
        isOpen: false,
    });

    const getInitialProperties = (newTemplate: IMongoEntityTemplatePopulated) => {
        if (!newTemplate.walletTransfer) return {};
        const props: Record<string, unknown> = {};
        const fromKey = newTemplate.walletTransfer.from;
        const toKey = newTemplate.walletTransfer.to;

        const fromProperty = newTemplate.properties.properties[fromKey];
        const toProperty = newTemplate.properties.properties[toKey];

        const shouldSetFrom = fromProperty?.relationshipReference?.relatedTemplateId === templateId;
        const shouldSetTo = toProperty?.relationshipReference?.relatedTemplateId === templateId;

        if (shouldSetFrom) props[fromKey] = expandedEntity.entity;
        else if (shouldSetTo) props[toKey] = expandedEntity.entity;

        return props;
    };

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

            const createdAt = new Date((connection.relationship.properties as { createdAt: string }).createdAt).getTime();
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
            template: {} as IMongoEntityTemplateWithConstraintsPopulated,
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
            width: 110,
            cellRenderer: memo<{ data: WalletTransferData }>(({ data }) => {
                if (!data.template || Object.keys(data.template).length === 0) return null;

                const hasPermissionToTemplate = Boolean(data.hasPermissionToRelatedTemplate) || isAdmin;
                const entityId = data.entity.properties._id;
                const entityLink = `/entity/${entityId}${isChildTemplate(data.template) ? `?childTemplateId=${data.template._id}` : ''}`;

                return (
                    <Grid container flexWrap="nowrap" justifyContent="right">
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
            <Grid container sx={{ marginTop: 2, justifyContent: 'flex-end', mb: 1 }}>
                {transferTemplates.length > 0 && (
                    <>
                        <Box
                            onClick={() => setIsSelectDialogOpen(true)}
                            sx={{
                                display: 'flex',
                                gap: '0.25rem',
                                alignItems: 'center',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                color: theme.palette.primary.main,
                            }}
                        >
                            <AddCircle fontSize="small" />
                            {i18next.t('entityPage.walletTransfer.addTransfer')}
                        </Box>
                        <Dialog
                            open={isSelectDialogOpen && !selectedTransferTemplate}
                            onClose={() => setIsSelectDialogOpen(false)}
                            maxWidth="md"
                            fullWidth
                            slotProps={{
                                paper: {
                                    sx: {
                                        overflow: 'hidden',
                                    },
                                },
                            }}
                        >
                            <Card sx={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                                <CardContent
                                    sx={{
                                        flex: 1,
                                        overflowY: 'auto',
                                        position: 'relative',
                                        paddingTop: 0,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            flexShrink: 0,
                                            position: 'sticky',
                                            top: 0,
                                            zIndex: 10,
                                            backgroundColor: 'white',
                                            padding: '16px 24px',
                                        }}
                                    >
                                        <Grid container alignItems="center" justifyContent="space-between">
                                            <BlueTitle
                                                title={i18next.t('entityPage.walletTransfer.selectTransferType')}
                                                component="h6"
                                                variant="h6"
                                            />
                                            <IconButton onClick={() => setIsSelectDialogOpen(false)} sx={{ color: theme.palette.primary.main }}>
                                                <CloseIcon />
                                            </IconButton>
                                        </Grid>
                                        <Box mt={2}>
                                            <Autocomplete
                                                id="template"
                                                options={transferTemplates}
                                                getOptionLabel={(option) => option.displayName}
                                                onChange={(_e, value) => {
                                                    if (value) {
                                                        setSelectedTransferTemplate(value);
                                                        setIsSelectDialogOpen(false);
                                                    }
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        size="small"
                                                        fullWidth
                                                        sx={{
                                                            '& .MuiInputBase-root': {
                                                                borderRadius: '10px',
                                                                width: 300,
                                                            },
                                                            '& fieldset': {
                                                                borderColor: '#CCCFE5',
                                                                color: '#CCCFE5',
                                                            },
                                                            '& label': {
                                                                color: '#9398C2',
                                                            },
                                                        }}
                                                        name="template"
                                                        variant="outlined"
                                                        label={i18next.t('entityTemplate')}
                                                    />
                                                )}
                                            />
                                        </Box>
                                    </Box>
                                </CardContent>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        gap: 2,
                                        p: 2,
                                        borderTop: '1px solid #E0E0E0',
                                    }}
                                >
                                    <Box
                                        component="button"
                                        onClick={() => setIsSelectDialogOpen(false)}
                                        sx={{
                                            backgroundColor: 'transparent',
                                            border: '1px solid #4752B6',
                                            borderRadius: '8px',
                                            color: '#4752B6',
                                            padding: '8px 24px',
                                            cursor: 'pointer',
                                            fontWeight: 500,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            '&:hover': {
                                                backgroundColor: '#F5F6FA',
                                            },
                                        }}
                                    >
                                        <CloseIcon fontSize="small" />
                                        {i18next.t('actions.cancel')}
                                    </Box>
                                    <Box
                                        component="button"
                                        disabled
                                        sx={{
                                            backgroundColor: '#E0E0E0',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: '#9E9E9E',
                                            padding: '8px 24px',
                                            cursor: 'not-allowed',
                                            fontWeight: 500,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                        }}
                                    >
                                        {i18next.t('actions.save')}
                                        <span>✓</span>
                                    </Box>
                                </Box>
                            </Card>
                        </Dialog>
                        {selectedTransferTemplate && (
                            <Dialog
                                open={Boolean(selectedTransferTemplate)}
                                maxWidth="md"
                                fullWidth
                                slotProps={{
                                    paper: {
                                        sx: {
                                            overflow: 'hidden',
                                        },
                                    },
                                }}
                            >
                                <CreateOrEditEntityDetails
                                    mutationProps={{
                                        actionType: ActionTypes.CreateEntity,
                                        payload: undefined,
                                        onSuccess: () => {
                                            queryClient.invalidateQueries({ queryKey: ['getExpandedEntity', expandedEntity.entity.properties._id] });
                                            setSelectedTransferTemplate(null);
                                        },
                                    }}
                                    entityTemplate={selectedTransferTemplate as ITemplate}
                                    initialCurrValues={{
                                        template: selectedTransferTemplate as ITemplate,
                                        properties: {
                                            ...getInitialProperties(selectedTransferTemplate),
                                            disabled: false,
                                        },
                                        attachmentsProperties: {},
                                    }}
                                    handleClose={() => setSelectedTransferTemplate(null)}
                                    externalErrors={externalErrors}
                                    setExternalErrors={setExternalErrors}
                                    createOrUpdateWithRuleBreachDialogState={createOrUpdateWithRuleBreachDialogState}
                                    setCreateOrUpdateWithRuleBreachDialogState={setCreateOrUpdateWithRuleBreachDialogState}
                                    getInitialProperties={getInitialProperties}
                                />
                            </Dialog>
                        )}
                    </>
                )}
            </Grid>
            <Grid container>
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
