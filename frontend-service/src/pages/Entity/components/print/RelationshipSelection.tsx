/* eslint-disable react/no-unstable-nested-components */
import { ChevronLeft, ExpandLess } from '@mui/icons-material';
import { Box, FormControl, Select, useTheme } from '@mui/material';
import { RichTreeViewPro, TreeItem2Props } from '@mui/x-tree-view-pro';
import React, { Dispatch, PropsWithChildren, SetStateAction, useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { IConnectionTemplateOfExpandedEntity } from '../..';
import { CustomExpandMore } from '../../../../common/SelectCheckBox';
import TreeItem from '../../../../common/Tree/TreeItem';
import { IEntityExpanded } from '../../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../../interfaces/entityTemplates';
import { IRelationshipTemplateMap } from '../../../../interfaces/relationshipTemplates';
import { getExpandedEntityByIdRequest } from '../../../../services/entitiesService';
import { useDarkModeStore } from '../../../../stores/darkMode';
import { useUserStore } from '../../../../stores/user';
import { sortTemplatesChildrenToParents } from '../../../../utils/expandedRelationships';
import { getAllAllowedEntities } from '../../../../utils/permissions/templatePermissions';

// item id is node id - parent id (if he has one)
const getItemId = (item: IConnectionTemplateOfExpandedEntity) => {
    console.log({ hi: `${item.relationshipTemplate._id}${item.parentRelationship ? `-${item.parentRelationship?._id}` : ''}`, item });

    return `${item.relationshipTemplate._id}${item.parentRelationship ? `-${item.parentRelationship?._id}` : ''}`;
};

const getItemLabel = (item: IConnectionTemplateOfExpandedEntity) =>
    `${item.relationshipTemplate.displayName} (${item.relationshipTemplate.sourceEntity.displayName} > ${item.relationshipTemplate.destinationEntity.displayName})`;

const getDepthFromId = (id: string) => id.split('-').length;

const RelationshipSelection: React.FC<{
    expandedEntity: IEntityExpanded;
    connections: RelationshipSelectProps['connections'];
    setConnections: RelationshipSelectProps['setConnections'];
    selectedConnections: RelationshipSelectProps['selectedConnections'];
    setSelectedConnections: RelationshipSelectProps['setSelectedConnections'];
}> = ({ expandedEntity, connections, setConnections, selectedConnections, setSelectedConnections }) => {
    const queryClient = useQueryClient();
    const currentUser = useUserStore((state) => state.user);

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const allRelationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

    const allowedEntityTemplates = getAllAllowedEntities(Array.from(entityTemplates.values()), currentUser);
    const allowedEntityTemplatesIds = allowedEntityTemplates.map((entity) => entity._id);

    const [expandedItemsIds, setExpandedItemsIds] = useState<string[]>([]);
    const [expansionDepth, setExpansionDepth] = useState<number>(2);

    const flattenSelectedIds = useMemo(() => {
        return selectedConnections.flatMap((parent) => [
            parent.relationshipTemplate._id,
            ...(parent.children?.map((child) => child.relationshipTemplate._id) || []),
        ]);
    }, [selectedConnections]);

    const [selectedItemsIds, setSelectedItemsIds] = useState<string[]>(flattenSelectedIds);

    const templateIds = Object.keys(entityTemplates);
    const { refetch: getExpandedData } = useQuery<IEntityExpanded>(
        ['getExpandedEntity', expandedEntity.entity.properties._id, { templateIds }],
        () =>
            getExpandedEntityByIdRequest(
                expandedEntity.entity.properties._id,
                { [expandedEntity.entity.properties._id]: { maxLevel: expansionDepth + 1, minLevel: expansionDepth + 1 } },
                { disabled: false, templateIds: allowedEntityTemplatesIds },
            ),
        {
            enabled: false,
            onSuccess: (data) => {
                console.log('before');
                setExpansionDepth((prev) => prev + 1);
                console.log('after');

                return data;
            },
        },
    );

    const findNodeById = useCallback((nodes: IConnectionTemplateOfExpandedEntity[], id: string): IConnectionTemplateOfExpandedEntity | null => {
        console.log({ nodes });

        for (const node of nodes) {
            if (id.startsWith(node.relationshipTemplate._id)) {
                if (!node.children || !id.includes('-')) return node;
            }

            if (node.children) {
                const found = findNodeById(node.children, id);
                if (found) return found;
            }
        }
        return null;
    }, []);

    const findParent = useCallback((nodes: IConnectionTemplateOfExpandedEntity[], id: string): IConnectionTemplateOfExpandedEntity | null => {
        const childId = id.includes('-') ? id.split('-')[0] : id;
        for (const node of nodes) {
            if (node.children?.some((child) => child.relationshipTemplate._id === childId)) return node;
            if (node.children) {
                const found = findParent(node.children, childId);
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
            const currentNode = findNodeById(connections, id);

            if (!currentNode) return;

            if ('parentRelationship' in currentNode) {
                // handle a child
                const parentIndex = currentSelectedNodes.findIndex(
                    (selectedNode) => currentNode.parentRelationship?._id === selectedNode.relationshipTemplate._id,
                );

                if (parentIndex !== -1) {
                    // if the parent is selected
                    const parent = currentSelectedNodes[parentIndex];

                    const childIndex = parent.children?.findIndex(
                        (selectedNode) => currentNode.relationshipTemplate._id === selectedNode.relationshipTemplate._id,
                    );
                    if (childIndex !== -1 && childIndex !== undefined) {
                        // If the child is already selected, remove it
                        const updatedChildren = [...(parent.children ?? [])];
                        updatedChildren.splice(childIndex, 1);
                        currentSelectedNodes = currentSelectedNodes.map((node) => {
                            if (node.relationshipTemplate._id === parent.relationshipTemplate._id) {
                                return {
                                    ...node,
                                    children: parent.children,
                                };
                            }
                            return node;
                        });
                    } else {
                        // If the child is not selected, add it
                        currentSelectedNodes = currentSelectedNodes.map((node) => {
                            if (node.relationshipTemplate._id === parent.relationshipTemplate._id) {
                                return {
                                    ...node,
                                    children: [...(node.children ?? []), currentNode],
                                };
                            }
                            return node;
                        });
                    }
                } else {
                    // if the parent isn't selected
                    const parent = findParent(connections, id);
                    if (!parent) throw new Error('child has to have a parent');
                    currentSelectedNodes.push({
                        ...parent,
                        children: [currentNode],
                    });
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
                    currentSelectedNodes.push({ ...currentNode, children: [] });
                }
            }
        });

        currentSelectedNodes.map((parent) =>
            parent.children?.map((child) => currentSelectedNodesIds.add(`${child.relationshipTemplate._id}-${child.parentRelationship?._id}`)),
        );
        currentSelectedNodes.map((parent) => currentSelectedNodesIds.add(parent.relationshipTemplate._id));

        console.log({ currentSelectedNodes });
        setSelectedConnections(currentSelectedNodes);
        return Array.from(currentSelectedNodesIds);
    };

    const TreeItemWrapper = useCallback((props: TreeItem2Props) => <TreeItem {...props} showIcon={false} />, []);

    return (
        <RichTreeViewPro
            style={{ direction: 'rtl' }}
            checkboxSelection
            multiSelect
            items={connections}
            getItemId={getItemId}
            getItemLabel={getItemLabel}
            selectedItems={selectedItemsIds}
            onSelectedItemsChange={(_, itemIds) => setSelectedItemsIds(handleSelectedItemsChange(itemIds))}
            onExpandedItemsChange={async (_, itemIds) => {
                const newlyExpandedId = itemIds.find((id) => !expandedItemsIds.includes(id));
                const currentDepth = getDepthFromId(newlyExpandedId!);
                console.log({ newlyExpandedId, currentDepth });

                if (currentDepth > expansionDepth && expansionDepth < 4) {
                    const { data } = await getExpandedData();
                    if (data) {
                        const newConnections = sortTemplatesChildrenToParents(
                            expansionDepth,
                            connections,
                            data,
                            allRelationshipTemplates,
                            entityTemplates,
                        );
                        console.log({ newConnections });

                        setConnections(newConnections);
                    }
                }

                const ids = itemIds
                    .map((itemId) => findNodeById(connections, itemId))
                    .filter((item): item is IConnectionTemplateOfExpandedEntity => item !== null)
                    .map((item) => getItemId(item));

                setExpandedItemsIds(ids);
            }}
            expandedItems={expandedItemsIds}
            expansionTrigger="iconContainer"
            slots={{
                expandIcon: ChevronLeft,
                collapseIcon: ExpandLess,
                item: TreeItemWrapper,
            }}
            experimentalFeatures={{ indentationAtItemLevel: true }}
        />
    );
};

type RelationshipSelectProps = PropsWithChildren<{
    title: string;
    connections: IConnectionTemplateOfExpandedEntity[];
    setConnections: React.Dispatch<IConnectionTemplateOfExpandedEntity[]>;
    expandedEntity: IEntityExpanded;
    selectedConnections: IConnectionTemplateOfExpandedEntity[];
    setSelectedConnections: Dispatch<SetStateAction<IConnectionTemplateOfExpandedEntity[]>>;
    size?: 'small' | 'medium';
    overrideSx?: object;
    isSelectDisabled?: boolean;
}>;

const RelationshipSelect = ({
    title,
    connections,
    setConnections,
    expandedEntity,
    selectedConnections,
    setSelectedConnections,
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
                <RelationshipSelection
                    connections={connections}
                    setConnections={setConnections}
                    selectedConnections={selectedConnections}
                    setSelectedConnections={setSelectedConnections}
                    expandedEntity={expandedEntity}
                />
            </Select>
        </FormControl>
    );
};

export default RelationshipSelect;
