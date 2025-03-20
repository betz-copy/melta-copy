/* eslint-disable react/no-unstable-nested-components */
import React, { useCallback, useState } from 'react';
import { RichTreeViewPro, TreeItem2Props } from '@mui/x-tree-view-pro';
import { ChevronLeft, ExpandLess } from '@mui/icons-material';
import TreeItem from '../../../../common/Tree/TreeItem';

export interface TreeNode {
    id: string;
    label: string;
    children?: TreeNode[];
}

const getItemId = (item: TreeNode) => item.id;
const getItemLabel = (item: TreeNode) => item.label;

const RelationshipSelection: React.FC<{ treeData: TreeNode[] }> = ({ treeData }) => {
    const [selectedItemsIds, setSelectedItemsIds] = useState<string[]>([]);
    const [expandedItemsIds, setExpandedItemsIds] = useState<string[]>([]);

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
        const updatedSelection = new Set(itemIds);

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
            const parent = findParent(treeData, id);
            if (parent) updatedSelection.add(parent.id);
        });

        return Array.from(updatedSelection);
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

export default RelationshipSelection;
