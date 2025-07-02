/* eslint-disable react/no-unstable-nested-components */
import React, { Dispatch, PropsWithChildren, SetStateAction, useCallback, useMemo, useState } from 'react';
import { RichTreeViewPro, TreeItem2Props } from '@mui/x-tree-view-pro';
import { ChevronLeft, ExpandLess } from '@mui/icons-material';
import { Box, FormControl, Select, useTheme } from '@mui/material';
import TreeItem from '../../../../common/Tree/TreeItem';
import { IConnectionTemplateExpanded, ISelectRelationshipTemplates } from '.';
import { CustomExpandMore } from '../../../../common/SelectCheckBox';
import { useDarkModeStore } from '../../../../stores/darkMode';

// item id is node id - parent id (if he has one)
const getItemId = (item: ISelectRelationshipTemplates | IConnectionTemplateExpanded) =>
    `${item.relationshipTemplate._id}${'parentRelationship' in item ? `-${item.parentRelationship?.relationshipTemplate._id}` : ''}`;

const getItemLabel = (item: ISelectRelationshipTemplates) =>
    `${item.relationshipTemplate.displayName} (${item.relationshipTemplate.sourceEntity.displayName} > ${item.relationshipTemplate.destinationEntity.displayName})`;

const RelationshipSelection: React.FC<{
    options: RelationshipSelectProps['options'];
    selectedOptions: RelationshipSelectProps['selectedOptions'];
    setSelectedOptions: RelationshipSelectProps['setSelectedOptions'];
}> = ({ options, selectedOptions, setSelectedOptions }) => {
    const [expandedItemsIds, setExpandedItemsIds] = useState<string[]>([]);

    const flattenSelectedIds = useMemo(() => {
        return selectedOptions.flatMap((parent) => [
            parent.relationshipTemplate._id,
            ...(parent.children?.map((child) => child.relationshipTemplate._id) || []),
        ]);
    }, [selectedOptions]);

    const [selectedItemsIds, setSelectedItemsIds] = useState<string[]>(flattenSelectedIds);

    const findNodeById = useCallback(
        (nodes: ISelectRelationshipTemplates[], id: string): ISelectRelationshipTemplates | IConnectionTemplateExpanded | null => {
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
        },
        [],
    );

    const findParent = useCallback((nodes: ISelectRelationshipTemplates[], id: string): ISelectRelationshipTemplates | null => {
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
        let currentSelectedNodes: ISelectRelationshipTemplates[] = [...selectedOptions];

        const changedIds = [
            ...itemIds.filter((itemId) => !selectedItemsIds.includes(itemId)),
            ...selectedItemsIds.filter((selectedItemId) => !itemIds.includes(selectedItemId)),
        ];

        changedIds.forEach((id) => {
            const currentNode = findNodeById(options, id);

            if (!currentNode) return;

            if ('parentRelationship' in currentNode) {
                // handle a child
                const parentIndex = currentSelectedNodes.findIndex(
                    (selectedNode) => currentNode.parentRelationship?.relationshipTemplate._id === selectedNode.relationshipTemplate._id,
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
                                    children: updatedChildren,
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
                    const parent = findParent(options, id);
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
            parent.children?.map((child) =>
                currentSelectedNodesIds.add(`${child.relationshipTemplate._id}-${child.parentRelationship?.relationshipTemplate._id}`),
            ),
        );
        currentSelectedNodes.map((parent) => currentSelectedNodesIds.add(parent.relationshipTemplate._id));

        setSelectedOptions(currentSelectedNodes);
        return Array.from(currentSelectedNodesIds);
    };

    const TreeItemWrapper = useCallback((props: TreeItem2Props) => <TreeItem {...props} showIcon={false} />, []);

    return (
        <RichTreeViewPro
            style={{ direction: 'rtl' }}
            checkboxSelection
            multiSelect
            items={options}
            getItemId={getItemId}
            getItemLabel={getItemLabel}
            selectedItems={selectedItemsIds}
            onSelectedItemsChange={(_, itemIds) => setSelectedItemsIds(handleSelectedItemsChange(itemIds))}
            onExpandedItemsChange={(_, itemIds) => {
                const ids = itemIds
                    .map((itemId) => findNodeById(options, itemId))
                    .filter((item): item is ISelectRelationshipTemplates | IConnectionTemplateExpanded => item !== null)
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
    options: ISelectRelationshipTemplates[];
    selectedOptions: ISelectRelationshipTemplates[];
    setSelectedOptions: Dispatch<SetStateAction<ISelectRelationshipTemplates[]>>;
    size?: 'small' | 'medium';
    overrideSx?: object;
    isSelectDisabled?: boolean;
}>;

const RelationshipSelect = ({
    title,
    options,
    selectedOptions,
    setSelectedOptions,
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
                <RelationshipSelection options={options} selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions} />
            </Select>
        </FormControl>
    );
};

export default RelationshipSelect;
