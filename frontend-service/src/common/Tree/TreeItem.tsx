// Most code is copied from
// https://mui.com/x/react-tree-view/rich-tree-view/ordering/

import { Box, Divider, Typography } from '@mui/material';
import {
    TreeItem2Props,
    useTreeItem2,
    TreeItem2Root,
    TreeItem2Content,
    TreeItem2IconContainer,
    TreeItem2Icon,
    TreeItem2DragAndDropOverlay,
    TreeItem2GroupTransition,
    TreeItem2Provider,
    TreeViewCancellableEventHandler,
} from '@mui/x-tree-view-pro';
import React from 'react';
import { Menu } from '@mui/icons-material';
import { MeltaCheckbox } from '../MeltaCheckbox';
import { MeltaTooltip } from '../MeltaTooltip';

const LabelWithToolTip = ({ children, className }) => (
    <Box className={className}>
        <MeltaTooltip title={children}>
            <Typography>{children}</Typography>
        </MeltaTooltip>
    </Box>
);

const DivideMenuItems = (
    <Box sx={{ display: 'flex', justifyContent: 'center', my: '5px' }}>
        <Divider style={{ width: '199px' }} />
    </Box>
);

const draggableHandle = (
    handleDragStart: (event: React.DragEvent) => void,
    onDragOver?: TreeViewCancellableEventHandler<React.DragEvent<Element>>,
    onDragEnd?: TreeViewCancellableEventHandler<React.DragEvent<Element>>,
) => (
    <TreeItem2IconContainer draggable onDragStart={handleDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
        <Menu />
    </TreeItem2IconContainer>
);

const TreeItem = React.forwardRef(function CustomTreeItem(props: TreeItem2Props, ref: React.Ref<HTMLLIElement>) {
    const { id, itemId, label, disabled, children, ...other } = props;

    const {
        getRootProps,
        getContentProps,
        getIconContainerProps,
        getCheckboxProps,
        getLabelProps,
        getGroupTransitionProps,
        getDragAndDropOverlayProps,
        status,
    } = useTreeItem2({ id, itemId, children, label, disabled, rootRef: ref });

    const { draggable, onDragStart, onDragOver, onDragEnd, ...otherRootProps }: ReturnType<typeof getRootProps> = getRootProps(other);
    const itemDepth = otherRootProps.style?.['--TreeView-itemDepth'];

    const handleDragStart = (event: React.DragEvent) => {
        if (!onDragStart) {
            return;
        }

        onDragStart(event);
        event.dataTransfer.setDragImage((event.target as HTMLElement).parentElement!, 0, 0);
    };

    return (
        // To fix this error probably requires to upgrade to react 18.
        // @ts-ignore
        <TreeItem2Provider {...props} ref={ref} itemId={itemId}>
            <TreeItem2Root
                {...otherRootProps}
                sx={{
                    '& .MuiButtonBase-root': {
                        padding: '3px 8px',
                    },
                }}
            >
                {itemDepth === 0 && DivideMenuItems}
                <TreeItem2Content
                    {...getContentProps()}
                    sx={{
                        backgroundColor: status.selected ? 'transparent' : undefined,
                    }}
                >
                    {(status.expandable || itemDepth !== 0 || !draggable) && (
                        <TreeItem2IconContainer {...getIconContainerProps()}>
                            <TreeItem2Icon status={status} />
                        </TreeItem2IconContainer>
                    )}
                    {draggable && draggableHandle(handleDragStart, onDragOver, onDragEnd)}
                    <MeltaCheckbox {...getCheckboxProps()} />
                    <LabelWithToolTip {...getLabelProps()} />
                    <TreeItem2DragAndDropOverlay {...getDragAndDropOverlayProps()} />
                </TreeItem2Content>
                {children && <TreeItem2GroupTransition {...getGroupTransitionProps()} />}
            </TreeItem2Root>
        </TreeItem2Provider>
    );
});

export default TreeItem;
