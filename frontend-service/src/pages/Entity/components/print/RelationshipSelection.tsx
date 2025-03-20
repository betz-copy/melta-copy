/* eslint-disable react/no-unstable-nested-components */
import React, { Dispatch, PropsWithChildren, SetStateAction, useCallback, useState } from 'react';
import { RichTreeViewPro, TreeItem2Props } from '@mui/x-tree-view-pro';
import { ChevronLeft, ExpandLess } from '@mui/icons-material';
import { Box, FormControl, Select } from '@mui/material';
import TreeItem from '../../../../common/Tree/TreeItem';

export interface TreeNode {
    id: string;
    label: string;
    children?: TreeNode[];
}

const getItemId = (item: TreeNode) => item.id;
const getItemLabel = (item: TreeNode) => item.label;

const RelationshipSelection: React.FC<{
    treeData: RelationshipSelectProps['options'];
    selectedOptions: RelationshipSelectProps['selectedOptions'];
    setSelectedOptions: RelationshipSelectProps['setSelectedOptions'];
    isOpen: boolean;
}> = ({ treeData, selectedOptions, setSelectedOptions, isOpen }) => {
    const [selectedItemsIds, setSelectedItemsIds] = useState<string[]>([]);
    const [expandedItemsIds, setExpandedItemsIds] = useState<string[]>([]);
    console.log({ selectedItemsIds, expandedItemsIds });

    const findNodeById = (nodes: TreeNode[], id: string): TreeNode | null => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findNodeById(node.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const handleSelectedItemsChange = (itemIds: string[]) => {
        console.log({ itemIds });

        const selectedNodes = new Set<TreeNode>();

        const findParent = (nodes: TreeNode[], childId: string): TreeNode | null => {
            for (const node of nodes) {
                if (node.children?.some((child) => child.id === childId)) return node;
                if (node.children) {
                    const found = findParent(node.children, childId);
                    if (found) return found;
                }
            }
            return null;
        };

        itemIds.forEach((id) => {
            const node = findNodeById(treeData, id);
            if (node) {
                selectedNodes.add(node);
                const parent = findParent(treeData, id);
                if (parent) {
                    selectedNodes.add(parent);
                }
            }
        });
        console.log({ selectedNodes });

        setSelectedOptions(Array.from(selectedNodes));
        return Array.from(selectedNodes).map((node) => node.id);
    };

    const TreeItemWrapper = useCallback((props: TreeItem2Props) => <TreeItem {...props} showIcon={false} />, []);

    return (
        <RichTreeViewPro
            style={{ direction: 'rtl' }}
            checkboxSelection
            multiSelect
            items={treeData}
            getItemId={getItemId}
            getItemLabel={getItemLabel}
            selectedItems={selectedOptions.map((option) => option.id)}
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
    options: TreeNode[];
    selectedOptions: TreeNode[];
    setSelectedOptions: Dispatch<SetStateAction<TreeNode[]>>;
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
    const [isOpen, setIsOpen] = useState(false);

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
                            backgroundColor: '#FFFFFF',
                            borderRadius: '10px',
                            padding: '10px',
                            boxShadow: '-2px 2px 6px 0px #1E27754D',
                        },
                    },
                }}
                size={size}
                onOpen={() => setIsOpen(true)}
                onClose={() => setIsOpen(false)}
                sx={{
                    ...overrideSx,
                    fontFamily: 'Rubik',
                    fontSize: '14px',
                    fontWeight: 400,
                    borderRadius: '8px',
                }}
            >
                <RelationshipSelection treeData={options} selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions} isOpen={isOpen} />
            </Select>
        </FormControl>
    );
};

export default RelationshipSelect;
