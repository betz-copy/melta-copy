import { Box, CircularProgress, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { FC, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import SearchInput from '../../../../common/inputs/SearchInput';
import { ArrowTail } from '../../../../common/RelationshipTitle';
import Tree, { flattenTree } from '../../../../common/Tree';
import { environment } from '../../../../globals';
import { IEntityExpanded } from '../../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../../interfaces/entityTemplates';
import { IRelationShipSelectionTree } from '../../../../interfaces/printingTemplates';
import { BackendConfigState } from '../../../../services/backendConfigService';
import { getRelationshipSelectTreeForPrint } from '../../../../services/entitiesService';
import { useUserStore } from '../../../../stores/user';
import { getAllAllowedEntities } from '../../../../utils/permissions/templatePermissions';
import { useSearchUnits } from '../../../SystemManagement/components/UnitsRow/useSearchUnits';

const { maxPrintLevel, neoIdsPathSeparator, relationshipPathSeparator, neoRelIdsSeparator } = environment.print;

interface ITreeNode extends Omit<IRelationShipSelectionTree, 'children'> {
    children?: ITreeNode[];
}

interface RelationshipSelectionProps {
    expandedEntity: IEntityExpanded;
    setSelectedRelationShipIds: React.Dispatch<React.SetStateAction<string[]>>;
    setSelectedEntitiesCount: React.Dispatch<React.SetStateAction<number>>;
}

const getItemLabelComponent = (item: ITreeNode, highlightedEntityId?: string) => {
    const isSourceHighlighted = item.sourceEntity._id === highlightedEntityId;
    const isDestinationHighlighted = item.destinationEntity._id === highlightedEntityId;

    return (
        <Grid container flexWrap="nowrap" alignItems="center" gap="5px">
            <span style={isSourceHighlighted ? { fontWeight: 600, color: '#000' } : { color: '#444444' }}>{item.sourceEntity.displayName}</span>
            <ArrowTail width={11} height={1} color="#9398C2" />
            <span style={{ color: '#4752B6' }}>{item.displayName}</span>
            <img src="/icons/arrow-head.svg" alt="" />
            <span style={isDestinationHighlighted ? { fontWeight: 600, color: '#000' } : { color: '#444444' }}>
                {item.destinationEntity.displayName}
            </span>
        </Grid>
    );
};

const getItemLabelText = (item: ITreeNode) => `${item.sourceEntity.displayName} - ${item.displayName} -> ${item.destinationEntity.displayName}`;

const getItemId = (item: ITreeNode) => `${item.neoRelIds.join(neoRelIdsSeparator)}${neoIdsPathSeparator}${item.path}`;

const calculateSelectedEntitiesCount = (selectedRelationshipIds: string[], entitiesCountByRelationshipId: Map<string, number>) =>
    selectedRelationshipIds.reduce((sum, id) => sum + (entitiesCountByRelationshipId.get(id) ?? 0), 0);

const RelationshipSelection: FC<RelationshipSelectionProps> = ({ expandedEntity, setSelectedRelationShipIds, setSelectedEntitiesCount }) => {
    const [selectedTreeItemIds, setSelectedTreeItemIds] = useState<string[]>([]);

    const rootEntityId = expandedEntity.entity.properties._id;

    const currentUser = useUserStore((s) => s.user);

    const queryClient = useQueryClient();
    const { maxEntitiesToPrint } = queryClient.getQueryData<BackendConfigState>('getBackendConfig')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const allowedEntityTemplatesIds = useMemo(
        () => getAllAllowedEntities(Array.from(entityTemplates.values()), currentUser).map((e) => e._id),
        [entityTemplates, currentUser],
    );

    const { data: relationShips, isLoading } = useQuery<ITreeNode[]>({
        queryKey: ['getRelationshipSelectTreeForPrint', rootEntityId, { allowedEntityTemplatesIds }],
        queryFn: () =>
            getRelationshipSelectTreeForPrint(
                rootEntityId,
                { [rootEntityId]: { maxLevel: maxPrintLevel } },
                { templateIds: allowedEntityTemplatesIds },
            ),

        enabled: !!rootEntityId,
    });

    const highlightedEntityByPath = useMemo(() => {
        const map = new Map<string, string>();

        if (!relationShips) return map;

        const buildMap = (nodes: ITreeNode[], parentEntityId: string): void => {
            for (const node of nodes) {
                const isSourceParent = node.sourceEntity._id === parentEntityId;
                const highlightedEntityId = isSourceParent ? node.destinationEntity._id : node.sourceEntity._id;

                map.set(node.path, highlightedEntityId);

                if (node.children?.length) buildMap(node.children, highlightedEntityId);
            }
        };

        buildMap(relationShips, expandedEntity.entity.templateId);
        return map;
    }, [relationShips, expandedEntity.entity.templateId]);

    const { expandedIds, onSearch, searchedUnits, setExpandedIds } = useSearchUnits(relationShips ?? [], getItemId, (item, search) =>
        getItemLabelText(item)
            .toLowerCase()
            .includes(search?.toLowerCase() ?? ''),
    );

    const getSelectedEntitiesCountById = useMemo(() => {
        const map = new Map<string, number>();
        const stack = relationShips ? [...relationShips] : [];

        while (stack.length) {
            const node = stack.pop()!;
            map.set(`${node.neoRelIds} ${node.path}`, node.entitiesCount);
            if (node.children?.length) stack.push(...node.children);
        }

        return map;
    }, [relationShips]);

    const includeParentRelationshipsInSelection = (selectedRelationshipIds: Set<string>, flattenedRelationshipNodes: ITreeNode[]) => {
        for (const selectedId of selectedRelationshipIds) {
            const path = selectedId.split(neoIdsPathSeparator).slice(1).join(neoIdsPathSeparator);
            const pathSegments = path.split(relationshipPathSeparator);

            for (let i = 1; i < pathSegments.length; i++) {
                const parentPath = pathSegments.slice(0, i).join(relationshipPathSeparator);
                const parentNode = flattenedRelationshipNodes.find((node) => node.path === parentPath);
                parentNode && selectedRelationshipIds.add(`${parentNode.neoRelIds}${neoIdsPathSeparator}${parentNode.path}`);
            }
        }
    };

    const allNodes = useMemo(() => flattenTree(relationShips ?? [], getItemId, true, false), [relationShips]);

    if (isLoading) return <CircularProgress size={20} />;
    if (!relationShips?.length)
        return (
            <Box sx={{ color: '#6B6F9A', px: 1 }}>
                <Typography sx={{ fontSize: '14px' }}>{i18next.t('entityPage.print.noRelationshipsToDisplay')}</Typography>
            </Box>
        );

    return (
        <>
            <Box
                sx={{
                    border: '1px solid #D0D4E8',
                    borderRadius: '10px',
                    backgroundColor: '#fff',
                    overflow: 'hidden',
                }}
            >
                <SearchInput width="100%" onChange={onSearch} borderRadius="7px" placeholder={i18next.t('entityPage.print.search')} clearButton />
            </Box>
            <Box
                sx={{
                    marginTop: '10px',
                    maxHeight: '230px',
                    overflowY: 'auto',
                }}
            >
                <Tree
                    treeItems={relationShips}
                    getItemId={getItemId}
                    getItemLabel={getItemLabelText}
                    renderItemLabel={(item) => getItemLabelComponent(item, highlightedEntityByPath.get(item.path))}
                    removeDivider
                    selectedItems={selectedTreeItemIds}
                    filteredTreeItems={searchedUnits}
                    selectionPropagation={{ descendants: true, parents: false }}
                    preExpandedItemIds={expandedIds}
                    onExpandedItemsChange={(_e, items) => setExpandedIds(items)}
                    onSelectItems={(itemIds) => {
                        const selectedRelationshipIds = new Set(itemIds as string[]);

                        if (selectedRelationshipIds.size > selectedTreeItemIds.length) {
                            includeParentRelationshipsInSelection(selectedRelationshipIds, allNodes);
                        }

                        const finalSelectedIds = [...selectedRelationshipIds];
                        const totalEntitiesCount = calculateSelectedEntitiesCount(finalSelectedIds, getSelectedEntitiesCountById);

                        if (totalEntitiesCount > maxEntitiesToPrint) {
                            toast.error(`${i18next.t('entityPage.print.warning.tooManyEntitiesSelected')} ${maxEntitiesToPrint}`);
                        } else {
                            setSelectedEntitiesCount(totalEntitiesCount);
                            setSelectedTreeItemIds(finalSelectedIds);
                            setSelectedRelationShipIds([
                                ...new Set(finalSelectedIds.flatMap((id) => id.split(neoIdsPathSeparator)[0]?.split(neoRelIdsSeparator) ?? [])),
                            ]);
                        }
                    }}
                />
            </Box>
        </>
    );
};

export default RelationshipSelection;
