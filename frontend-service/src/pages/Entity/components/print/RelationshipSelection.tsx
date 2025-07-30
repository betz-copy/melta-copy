/* eslint-disable react/no-unstable-nested-components */
import { ChevronLeft, ExpandLess } from '@mui/icons-material';
import { Box, FormControl, Select, useTheme } from '@mui/material';
import { RichTreeViewPro, TreeItemProps } from '@mui/x-tree-view-pro';
import React, { Dispatch, PropsWithChildren, SetStateAction, useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { INestedRelationshipTemplates } from '../..';
import { CustomExpandMore } from '../../../../common/SelectCheckBox';
import TreeItem from '../../../../common/Tree/TreeItem';
import { IConnection, IEntityExpanded } from '../../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../../interfaces/entityTemplates';
import { IRelationshipTemplateMap } from '../../../../interfaces/relationshipTemplates';
import { getExpandedEntityByIdRequest } from '../../../../services/entitiesService';
import { useDarkModeStore } from '../../../../stores/darkMode';
import { useUserStore } from '../../../../stores/user';
import { findAncestryTree, mergeAncestryTree, sortTemplatesChildrenToParents, updateChildrenToParent } from '../../../../utils/expandedRelationships';
import { getAllAllowedEntities } from '../../../../utils/permissions/templatePermissions';

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

    const findParent = useCallback((nodes: INestedRelationshipTemplates[], id: string): INestedRelationshipTemplates | null => {
        const targetId = id.split('-')[1];
        for (const node of nodes) {
            if (node.children?.some((child) => child.relationshipTemplate._id === targetId)) {
                return node;
            }

            if (node.children && node.children.length > 0) {
                const found = findParent(node.children, id);
                if (found) return found;
            }
        }

        return null;
    }, []);

    const handleSelectedItemsChange = (itemIds: string[]) => {
        const currentSelectedNodesIds = new Set<string>();
        let currentSelectedNodes = [...selectedConnections];

        const changedIds = [
            ...itemIds.filter((itemId) => !selectedItemsIds.includes(itemId)),
            ...selectedItemsIds.filter((selectedItemId) => !itemIds.includes(selectedItemId)),
        ];

        changedIds.forEach((id) => {
            const currentNode = findNodeById(connectionsTemplates, id);

            if (!currentNode) return;

            if (currentNode.parentRelationship) {
                // handle a child

                const parent = findParent(selectedConnections, id);

                if (!!parent) {
                    // if the parent is selected

                    const childIndex = parent.children?.findIndex(
                        (selectedNode) => currentNode.relationshipTemplate._id === selectedNode.relationshipTemplate._id,
                    );

                    if (childIndex !== -1 && childIndex !== undefined) {
                        // If the child is already selected, remove it
                        const updatedParent: INestedRelationshipTemplates = {
                            ...parent,
                            children: (parent.children ?? []).filter(
                                (child) => child.relationshipTemplate._id !== currentNode.relationshipTemplate._id,
                            ),
                        };
                        currentSelectedNodes = updateChildrenToParent(1, currentSelectedNodes, updatedParent);
                    } else {
                        // If the child is not selected, add it
                        const updatedParent = {
                            ...parent,
                            children: [...parent.children, currentNode],
                        };
                        currentSelectedNodes = updateChildrenToParent(1, currentSelectedNodes, updatedParent);
                    }
                } else {
                    // if the parent isn't selected

                    const ancestryTree = findAncestryTree(connectionsTemplates, id);
                    if (ancestryTree) currentSelectedNodes = mergeAncestryTree(currentSelectedNodes, ancestryTree);
                }
            } else {
                // if it's a parent
                const parentIndex = currentSelectedNodes.findIndex(
                    (selectedNode) => currentNode.relationshipTemplate._id === selectedNode.relationshipTemplate._id,
                );

                if (parentIndex !== -1) {
                    // If the parent is selected, remove it
                    currentSelectedNodes.splice(parentIndex, 1);
                } else {
                    // If the parent is not selected, add it
                    currentSelectedNodes.push(currentNode);
                }
            }
        });

        collectAllSelectedItemIds(currentSelectedNodes, currentSelectedNodesIds);

        setSelectedConnections(currentSelectedNodes);

        return Array.from(currentSelectedNodesIds);
    };

    const TreeItemWrapper = useCallback((props: TreeItemProps) => <TreeItem {...props} showIcon={false} />, []);

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
    );
};

type RelationshipSelectProps = PropsWithChildren<{
    title: string;
    expandedEntity: IEntityExpanded;
    entityConnections: EntityConnectionsProps;
    size?: 'small' | 'medium';
    overrideSx?: object;
    isSelectDisabled?: boolean;
}>;

const RelationshipSelect = ({
    title,
    expandedEntity,
    entityConnections,
    size = 'medium',
    overrideSx,
    isSelectDisabled = false,
}: RelationshipSelectProps) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const theme = useTheme();

    return (
        <FormControl>
            <Select
                displayEmpty
                disabled={isSelectDisabled}
                renderValue={() => <Box>{title}</Box>}
                MenuProps={{
                    PaperProps: {
                        style: {
                            height: '333px',
                            minWidth: '219px',
                            width: '300px',
                            ...(darkMode ? {} : { backgroundColor: '#FFFFFF' }),
                            borderRadius: overrideSx ? '10px' : '20px 0px 20px 20px',
                            padding: '10px, 10px, 5px, 10px',
                            boxShadow: '-2px 2px 6px 0px #1E27754D',
                            top: '39px',
                            gap: '15px',
                            marginTop: '5px',
                            border: darkMode ? `solid 2px ${theme.palette.primary.main}` : 'none',
                        },
                        sx: {
                            overflowY: 'overlay',
                            '::-webkit-scrollbar-track': {
                                marginY: '1rem',
                                bgcolor: '#FFFFFF',
                                borderRadius: '5px',
                            },
                            '::-webkit-scrollbar-thumb': { background: '#EBEFFA' },
                        },
                    },
                }}
                IconComponent={(params) => CustomExpandMore({ undefined, ...params })}
                size={size}
                sx={{
                    ...overrideSx,
                    fontFamily: 'Rubik',
                    fontSize: '14px',
                    fontWeight: 400,
                    boxShadow: 'none',
                    borderRadius: '8px',
                    ...(darkMode
                        ? {
                              color: theme.palette.primary.main,
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d2d3e3' },
                          }
                        : {
                              '& .MuiOutlinedInput-notchedOutline': { display: 'none' },
                              background: '#FFFFFF',
                              color: '#787C9E',
                          }),
                    maxWidth: !overrideSx ? '131px' : undefined,
                    maxHeight: '34px',
                    padding: '0px, 8px',
                }}
            >
                <RelationshipSelection entityConnections={entityConnections} expandedEntity={expandedEntity} />
            </Select>
        </FormControl>
    );
};

export default RelationshipSelect;
