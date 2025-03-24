/* eslint-disable react/no-unstable-nested-components */
import React, { Dispatch, PropsWithChildren, SetStateAction, useCallback, useState } from 'react';
import { RichTreeViewPro, TreeItem2Props } from '@mui/x-tree-view-pro';
import { ChevronLeft, ExpandLess } from '@mui/icons-material';
import { Box, FormControl, Select, useTheme } from '@mui/material';
import TreeItem from '../../../../common/Tree/TreeItem';
import { IConnectionTemplateExpanded, ISelectRelationshipTemplates } from '.';
import { CustomExpandMore } from '../../../../common/SelectCheckBox';
import { useDarkModeStore } from '../../../../stores/darkMode';

const getItemId = (item: ISelectRelationshipTemplates | IConnectionTemplateExpanded) => item.relationshipTemplate._id;
const getItemLabel = (item: ISelectRelationshipTemplates) =>
    `${item.relationshipTemplate.displayName} (${item.relationshipTemplate.sourceEntity.displayName} > ${item.relationshipTemplate.destinationEntity.displayName})`;

const RelationshipSelection: React.FC<{
    options: RelationshipSelectProps['options'];
    selectedOptions: RelationshipSelectProps['selectedOptions'];
    setSelectedOptions: RelationshipSelectProps['setSelectedOptions'];
}> = ({ options, selectedOptions, setSelectedOptions }) => {
    const [expandedItemsIds, setExpandedItemsIds] = useState<string[]>([]);
    const [selectedItemsIds, setSelectedItemsIds] = useState<string[]>(
        [
            ...selectedOptions.map((parent) => parent.children?.map((child) => child.relationshipTemplate._id)).flat(),
            ...selectedOptions.map((parent) => parent.relationshipTemplate._id),
        ].filter((id): id is string => id !== undefined),
    );

    const findNodeById = (nodes: ISelectRelationshipTemplates[], id: string): ISelectRelationshipTemplates | IConnectionTemplateExpanded | null => {
        for (const node of nodes) {
            if (getItemId(node) === id) return node;
            if (node.children) {
                const found = findNodeById(node.children, id);

                if (found) return found;
            }
        }
        return null;
    };

    const handleSelectedItemsChange = (itemIds: string[]) => {
        const selectedNodesIds = new Set<string>();
        let selectedNodes: ISelectRelationshipTemplates[] = [...selectedOptions];

        const findParent = (nodes: ISelectRelationshipTemplates[], childId: string): ISelectRelationshipTemplates | null => {
            for (const node of nodes) {
                if (node.children?.some((child) => child.relationshipTemplate._id === childId)) return node;
                if (node.children) {
                    const found = findParent(node.children, childId);
                    if (found) return found;
                }
            }
            return null;
        };

        const changedIds = [
            ...itemIds.filter((itemId) => !selectedItemsIds.includes(itemId)),
            ...selectedItemsIds.filter((selectedItemId) => !itemIds.includes(selectedItemId)),
        ];

        changedIds.forEach((id) => {
            const node = findNodeById(options, id);
            if (node) {
                if ('parentRelationship' in node) {
                    // if it's a child
                    const parentIndex = selectedNodes.findIndex(
                        (selectedNode) => node.parentRelationship?.relationshipTemplate._id === selectedNode.relationshipTemplate._id,
                    );

                    if (parentIndex !== -1) {
                        // if the parent is selected
                        const parent = selectedNodes[parentIndex];
                        const childIndex = parent.children?.findIndex(
                            (selectedNode) => node.relationshipTemplate._id === selectedNode.relationshipTemplate._id,
                        );
                        if (childIndex !== -1) {
                            // if the child is selected
                            selectedNodes = [
                                ...selectedNodes.splice(parentIndex, 1),
                                {
                                    ...parent,
                                    children: parent.children?.splice(childIndex || 0, 1),
                                },
                            ];
                        } else {
                            // if the child is not selected
                            selectedNodes = [
                                ...selectedNodes.splice(parentIndex, 1),
                                {
                                    ...parent,
                                    children: [...(parent.children ?? []), node],
                                },
                            ];
                        }
                    } else {
                        // if the parent isn't selected
                        const parent = findParent(options, id);
                        if (!parent) throw new Error('child has to have a parent');
                        selectedNodes.push({
                            ...parent,
                            children: [node],
                        });
                    }
                } else {
                    // if it's a parent
                    const parentIndex = selectedNodes.findIndex(
                        (selectedNode) => node.relationshipTemplate._id === selectedNode.relationshipTemplate._id,
                    );

                    if (parentIndex !== -1) {
                        // if the parent is selected
                        selectedNodes = selectedNodes.splice(parentIndex, 1);
                    } else {
                        // if the parent is not selected
                        selectedNodes.push({ ...node, children: [] });
                    }
                }
            }
        });

        selectedNodes.map((parent) => parent.children?.map((child) => selectedNodesIds.add(child.relationshipTemplate._id)));
        selectedNodes.map((parent) => selectedNodesIds.add(parent.relationshipTemplate._id));

        setSelectedOptions(selectedNodes);
        return Array.from(selectedNodesIds);
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
            onExpandedItemsChange={(_, itemIds) => setExpandedItemsIds(itemIds)}
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
