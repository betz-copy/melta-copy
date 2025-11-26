/* eslint-disable react/no-unstable-nested-components */
import { ChevronLeft, ExpandLess } from '@mui/icons-material';
import { Grid, Typography } from '@mui/material';
import { RichTreeViewPro, TreeItemProps, useTreeViewApiRef } from '@mui/x-tree-view-pro';
import i18next from 'i18next';
import React, { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import TreeItem from '../../../../common/Tree/TreeItem';
import { IConnection, IEntityExpanded } from '../../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../../interfaces/entityTemplates';
import { IRelationshipTemplateMap } from '../../../../interfaces/relationshipTemplates';
import { getExpandedEntityByIdRequest } from '../../../../services/entitiesService';
import { useUserStore } from '../../../../stores/user';
import { findAncestryTree, mergeAncestryTree, sortTemplatesChildrenToParents, updateChildrenToParent } from '../../../../utils/expandedRelationships';
import { getAllAllowedEntities } from '../../../../utils/permissions/templatePermissions';
import { INestedRelationshipTemplates } from '../..';

const collectAllSelectedItemIds = (nodes: INestedRelationshipTemplates[], selectedIds: Set<string>) => {
    for (const node of nodes) {
        selectedIds.add(getItemId(node));
        if (node.children && node.children.length > 0) {
            collectAllSelectedItemIds(node.children, selectedIds);
        }
    }
};

// item id is node depth - node id - parent id (if he has one)
const getItemId = ({ depth, relationshipTemplate: { _id }, parentRelationship }: INestedRelationshipTemplates) =>
    `${depth}-${_id}${parentRelationship ? `-${parentRelationship?._id}` : ''}`;

const getItemLabel = ({ relationshipTemplate: { displayName, sourceEntity, destinationEntity } }: INestedRelationshipTemplates) =>
    `${displayName} (${sourceEntity.displayName} > ${destinationEntity.displayName})`;

export type EntityConnectionsProps = {
    connectionsTemplates: INestedRelationshipTemplates[];
    setConnectionsTemplates: Dispatch<SetStateAction<INestedRelationshipTemplates[]>>;
    setConnectionsInstances: Dispatch<SetStateAction<IConnection[]>>;
    selectedConnections: INestedRelationshipTemplates[];
    setSelectedConnections: Dispatch<SetStateAction<INestedRelationshipTemplates[]>>;
};

const RelationshipSelection: React.FC<{
    expandedEntity: IEntityExpanded;
    entityConnections: EntityConnectionsProps;
}> = ({
    expandedEntity,
    entityConnections: { connectionsTemplates, setConnectionsTemplates, setConnectionsInstances, selectedConnections, setSelectedConnections },
}) => {
    const queryClient = useQueryClient();
    const currentUser = useUserStore((state) => state.user);
    const apiRef = useTreeViewApiRef();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const allRelationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

    const allowedEntityTemplates = getAllAllowedEntities(Array.from(entityTemplates.values()), currentUser);
    const allowedEntityTemplatesIds = allowedEntityTemplates.map((entity) => entity._id);

    const flattenSelectedIds = useMemo(() => {
        return selectedConnections.flatMap((parent) => [
            parent.relationshipTemplate._id,
            ...(parent.children?.map((child) => child.relationshipTemplate._id) || []),
        ]);
    }, [selectedConnections]);

    const [selectedItemsIds, setSelectedItemsIds] = useState<string[]>(flattenSelectedIds);
    const [expansionDepth, setExpansionDepth] = useState<number>(1);

    const templateIds = [...entityTemplates.keys()];
    const { refetch: getExpandedData } = useQuery<IEntityExpanded>({
        queryKey: ['getExpandedEntity', expandedEntity.entity.properties._id, { templateIds }, expansionDepth],
        queryFn: () =>
            getExpandedEntityByIdRequest(
                expandedEntity.entity.properties._id,
                { [expandedEntity.entity.properties._id]: { maxLevel: expansionDepth + 1 } },
                { disabled: false, templateIds: allowedEntityTemplatesIds },
            ),
        enabled: false,
    });

    const findNodeById = (nodes: INestedRelationshipTemplates[], id: string): INestedRelationshipTemplates | undefined => {
        for (const node of nodes) {
            if (getItemId(node) === id) return node;
            if (node.children) {
                const found = findNodeById(node.children, id);
                if (found) return found;
            }
        }
        return undefined;
    };

    const findParent = useCallback((nodes: INestedRelationshipTemplates[], id: string): INestedRelationshipTemplates | undefined => {
        const targetId = id.split('-')[1];
        for (const node of nodes) {
            if (node.children?.some((child) => child.relationshipTemplate._id === targetId)) return node;

            if (node.children && node.children.length > 0) {
                const found = findParent(node.children, id);
                if (found) return found;
            }
        }

        return undefined;
    }, []);

    const handleSelectedItemsChange = (itemIds: string[]) => {
        const currentSelectedNodesIds = new Set<string>();
        let currentSelectedNodes = [...selectedConnections];

        const changedIds = [...itemIds.filter((id) => !selectedItemsIds.includes(id)), ...selectedItemsIds.filter((id) => !itemIds.includes(id))];

        for (const id of changedIds) {
            const currentNode = findNodeById(connectionsTemplates, id);

            if (!currentNode) continue;

            if (currentNode.parentRelationship) {
                // handle a child
                const parent = findParent(selectedConnections, id);

                if (parent) {
                    // if the parent is selected
                    const isChildAlreadySelected = parent.children?.some(
                        ({ relationshipTemplate }) => relationshipTemplate._id === currentNode.relationshipTemplate._id,
                    );

                    const updatedParent: INestedRelationshipTemplates = {
                        ...parent,
                        children: isChildAlreadySelected
                            ? parent.children?.filter(({ relationshipTemplate }) => relationshipTemplate._id !== currentNode.relationshipTemplate._id)
                            : [...parent.children, currentNode],
                    };
                    currentSelectedNodes = updateChildrenToParent(1, currentSelectedNodes, updatedParent);
                } else {
                    // if the parent isn't selected
                    const ancestryTree = findAncestryTree(connectionsTemplates, id);
                    if (ancestryTree) currentSelectedNodes = mergeAncestryTree(currentSelectedNodes, ancestryTree);
                }
            } else {
                // if it's a parent
                const isParentSelected = currentSelectedNodes.some((node) => node.relationshipTemplate._id === currentNode.relationshipTemplate._id);

                if (isParentSelected) {
                    // If the parent is selected, remove it
                    currentSelectedNodes = currentSelectedNodes.filter(
                        ({ relationshipTemplate }) => relationshipTemplate._id !== currentNode.relationshipTemplate._id,
                    );
                } else {
                    // If the parent is not selected, add it
                    currentSelectedNodes.push(currentNode);
                }
            }
        }

        collectAllSelectedItemIds(currentSelectedNodes, currentSelectedNodesIds);

        setSelectedConnections(currentSelectedNodes);

        return Array.from(currentSelectedNodesIds);
    };

    const getItemById = useCallback((itemId: string) => apiRef.current?.getItem(itemId), [apiRef]);

    const TreeItemWrapper = useCallback(
        (props: TreeItemProps) => <TreeItem node={getItemById(props.itemId)} {...props} showIcon={false} removeDivider />,
        [getItemById],
    );

    const fetchTreeItems = async (parentId?: string): Promise<INestedRelationshipTemplates[]> => {
        const { data } = await getExpandedData();

        if (!data) return [];

        const sorted = sortTemplatesChildrenToParents(2, connectionsTemplates, data, allRelationshipTemplates, entityTemplates);

        setExpansionDepth((prev) => prev + 1);

        setConnectionsTemplates(sorted);
        setConnectionsInstances(data.connections);

        if (!parentId) return sorted;

        const parent = findNodeById(sorted, parentId);
        const selectedParent = findNodeById(selectedConnections, parentId);
        if (selectedParent && parent!.children) {
            // if parent is selected select all the children
            const mergedIds = Array.from(new Set([...selectedItemsIds, ...parent!.children.map(getItemId)]));

            setSelectedItemsIds(handleSelectedItemsChange(mergedIds));
        }
        return parent?.children ?? [];
    };

    return (
        <>
            <Typography color="#53566E" fontSize="14px" marginBottom={1}>
                {i18next.t('entityPage.print.chooseRelationship')}
            </Typography>
            <Grid maxHeight="228px" sx={{ overflowY: 'auto' }}>
                <RichTreeViewPro
                    items={[]}
                    dataSource={{
                        getChildrenCount: (item) => item?.children.length,
                        getTreeItems: fetchTreeItems,
                    }}
                    slots={{
                        expandIcon: ChevronLeft,
                        collapseIcon: ExpandLess,
                        item: TreeItemWrapper,
                    }}
                    multiSelect
                    checkboxSelection
                    getItemId={getItemId}
                    getItemLabel={getItemLabel}
                    selectedItems={selectedItemsIds}
                    onSelectedItemsChange={(_, itemIds) => setSelectedItemsIds(handleSelectedItemsChange(itemIds))}
                />
            </Grid>
        </>
    );
};

export default RelationshipSelection;
