// Most code is copied from
// https://mui.com/x/react-tree-view/rich-tree-view/ordering/

import { Hive as HiveIcon, Menu } from '@mui/icons-material';
import { Box, CircularProgress, Divider, Typography, useTheme } from '@mui/material';
import {
    TreeItemContent,
    TreeItemDragAndDropOverlay,
    TreeItemGroupTransition,
    TreeItemIcon,
    TreeItemIconContainer,
    TreeItemProps,
    TreeItemProvider,
    TreeItemRoot,
    TreeViewCancellableEventHandler,
    useTreeItem,
} from '@mui/x-tree-view-pro';
import React, { useMemo } from 'react';
import { CustomIcon } from '../CustomIcon';
import MeltaCheckbox from '../MeltaDesigns/MeltaCheckbox';
import MeltaTooltip from '../MeltaDesigns/MeltaTooltip';
import { TreeProps } from '.';

const LabelWithToolTip = ({ children, className }) => (
    <Box
        className={className}
        sx={{
            display: 'inline-block',
            position: 'relative',
            overflow: 'hidden',
        }}
    >
        <MeltaTooltip title={children}>
            <Typography
                sx={{
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}
            >
                {children}
            </Typography>
        </MeltaTooltip>
    </Box>
);

export const DivideMenuItems = (
    <Box sx={{ display: 'flex', justifyContent: 'center', my: '5px' }}>
        <Divider style={{ width: '199px' }} />
    </Box>
);

const draggableHandle = (
    handleDragStart: (event: React.DragEvent) => void,
    onDragOver?: TreeViewCancellableEventHandler<React.DragEvent<Element>>,
    onDragEnd?: TreeViewCancellableEventHandler<React.DragEvent<Element>>,
) => (
    <TreeItemIconContainer
        sx={{
            '& .MuiSvgIcon-root': {
                fontSize: '1rem',
            },
        }}
        draggable
        onDragStart={handleDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
    >
        <Menu />
    </TreeItemIconContainer>
);

const TreeItem = React.forwardRef(function CustomTreeItem<T extends Record<string, any>>(
    props: TreeItemProps & {
        node: T;
        additionalOptions?: TreeProps<T>['additionalOptions'];
        getStyles?: TreeProps<T>['getStyles'];
        removeDivider?: TreeProps<T>['removeDivider'];
        showIcon?: TreeProps<T>['showIcon'];
    },
    ref: React.Ref<HTMLLIElement>,
) {
    const { id, itemId, label, disabled, children, showIcon, removeDivider, node, additionalOptions, getStyles, ...other } = props;
    const {
        getRootProps,
        getContentProps,
        getIconContainerProps,
        getCheckboxProps,
        getLabelProps,
        getGroupTransitionProps,
        getDragAndDropOverlayProps,
        status,
        publicAPI,
    } = useTreeItem({ id, itemId, children, label, disabled, rootRef: ref });
    const theme = useTheme();

    const checkBoxProps = getCheckboxProps();
    const item = publicAPI.getItem(itemId);

    const rootProps = getRootProps(other) as ReturnType<typeof getRootProps>;
    const { draggable, onDragStart, onDragOver, onDragEnd, ...otherRootProps } = rootProps;
    const itemDepth = otherRootProps.style?.['--TreeView-itemDepth'];

    const handleDragStart = (event: React.DragEvent) => {
        if (!onDragStart) return;

        onDragStart(event);
        event.dataTransfer.setDragImage((event.target as HTMLElement).parentElement!, 0, 0);
    };

    const additionalRowIcon = useMemo(() => {
        if (!showIcon) return undefined;

        return item.iconFileId ? (
            <CustomIcon color={theme.palette.primary.main} iconUrl={item.iconFileId!} height="15px" width="15px" />
        ) : (
            <HiveIcon style={{ color: theme.palette.primary.main }} fontSize="inherit" />
        );
    }, [item, showIcon, theme.palette.primary.main]);

    const styles = getStyles?.({ node, status, itemDepth });

    return (
        // @ts-ignore
        <TreeItemProvider {...props} ref={ref} itemId={itemId}>
            <TreeItemRoot
                {...rootProps}
                sx={{
                    '& .MuiButtonBase-root': {
                        padding: '0px 8px',
                    },
                }}
            >
                <TreeItemContent
                    {...getContentProps()}
                    sx={{
                        backgroundColor: 'transparent !important',
                        ...styles?.treeItemContent,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                        }}
                    >
                        {draggable && draggableHandle(handleDragStart, onDragOver, onDragEnd)}

                        {(status.expandable || itemDepth !== 0 || !draggable) &&
                            (status.loading ? (
                                <CircularProgress size={20} />
                            ) : (
                                <TreeItemIconContainer {...getIconContainerProps()}>
                                    <TreeItemIcon status={status} />
                                </TreeItemIconContainer>
                            ))}

                        {checkBoxProps.visible && (
                            <Box onClick={(e) => e.stopPropagation()}>
                                <MeltaCheckbox {...checkBoxProps} sxChecked={{ width: '18px', height: '18px' }} />
                            </Box>
                        )}

                        <LabelWithToolTip {...getLabelProps()} />

                        {additionalRowIcon}

                        <TreeItemDragAndDropOverlay {...getDragAndDropOverlayProps()} />
                    </div>

                    {additionalOptions?.map((option) => option(node))}
                </TreeItemContent>

                {children && <TreeItemGroupTransition {...getGroupTransitionProps()} sx={styles?.treeNodeGroupTransition} />}

                {!removeDivider && itemDepth === 0 && status.expandable && DivideMenuItems}
            </TreeItemRoot>
        </TreeItemProvider>
    );
});

export default TreeItem;
