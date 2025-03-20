/* eslint-disable react/no-unstable-nested-components */
import React, { Dispatch, PropsWithChildren, SetStateAction, useCallback, useState } from 'react';
import { RichTreeViewPro, TreeItem2Props } from '@mui/x-tree-view-pro';
import { ChevronLeft, ExpandLess } from '@mui/icons-material';
import { Box, FormControl, Select, useTheme } from '@mui/material';
import TreeItem from '../../../../common/Tree/TreeItem';
import { ISelectRelationshipTemplates } from '.';
import { CustomExpandMore } from '../../../../common/SelectCheckBox';
import { useDarkModeStore } from '../../../../stores/darkMode';

const getItemId = (item: ISelectRelationshipTemplates) => item.relationshipTemplate._id;
const getItemLabel = (item: ISelectRelationshipTemplates) =>
    `${item.relationshipTemplate.displayName} (${item.relationshipTemplate.sourceEntity.displayName} > ${item.relationshipTemplate.destinationEntity.displayName})`;

const RelationshipSelection: React.FC<{
    options: RelationshipSelectProps['options'];
    selectedOptions: RelationshipSelectProps['selectedOptions'];
    setSelectedOptions: RelationshipSelectProps['setSelectedOptions'];
}> = ({ options, selectedOptions, setSelectedOptions }) => {
    const [expandedItemsIds, setExpandedItemsIds] = useState<string[]>([]);

    const findNodeById = (nodes: ISelectRelationshipTemplates[], id: string): ISelectRelationshipTemplates | null => {
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
        const selectedNodes = new Set<ISelectRelationshipTemplates>();
        const selectedParentsWithChildren: ISelectRelationshipTemplates[] = [];

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

        itemIds.forEach((id) => {
            const node = findNodeById(options, id);
            if (node) {
                selectedNodes.add(node);
                const parent = findParent(options, id);
                if (parent) {
                    selectedNodes.add(parent);
                    const selectedParent = selectedParentsWithChildren.find(
                        (selectedParentWithChild) => selectedParentWithChild.relationshipTemplate._id === parent.relationshipTemplate._id,
                    );
                    if (selectedParent) selectedParent.children = [...(selectedParent.children ?? []), node];
                    else selectedParentsWithChildren.push({ ...parent, children: [node] });
                } else selectedParentsWithChildren.push({ ...node, children: [] });
            }
        });

        setSelectedOptions(selectedParentsWithChildren);
        return Array.from(selectedNodes).map((node) => node.relationshipTemplate._id);
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
            selectedItems={selectedOptions.map((option) => option.relationshipTemplate._id)}
            onSelectedItemsChange={(_, itemIds) => handleSelectedItemsChange(itemIds)}
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
                    borderRadius: '8px',
                }}
            >
                <RelationshipSelection options={options} selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions} />
            </Select>
        </FormControl>
    );
};

export default RelationshipSelect;
