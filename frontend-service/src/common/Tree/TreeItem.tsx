// Most code is copied from
// https://mui.com/x/react-tree-view/rich-tree-view/ordering/

import { Hive as HiveIcon, Menu } from '@mui/icons-material';
import { Box, Divider, Typography, useTheme } from '@mui/material';
import {
    TreeItem2Content,
    TreeItem2DragAndDropOverlay,
    TreeItem2GroupTransition,
    TreeItem2Icon,
    TreeItem2IconContainer,
    TreeItem2Props,
    TreeItem2Provider,
    TreeItem2Root,
    TreeViewCancellableEventHandler,
    useTreeItem2,
} from '@mui/x-tree-view-pro';
import React, { useMemo } from 'react';
import { CustomIcon } from '../CustomIcon';
import { MeltaCheckbox } from '../MeltaCheckbox';
import { MeltaTooltip } from '../MeltaTooltip';

const LabelWithToolTip = ({ children, className }) => (
    <Box
        className={className}
        sx={{
            width: '200px',
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
    <TreeItem2IconContainer
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
    </TreeItem2IconContainer>
);

const TreeItem = React.forwardRef<HTMLLIElement, TreeItem2Props & { showIcon?: boolean }>((props, ref) => {
    const { id, itemId, label, disabled, children, showIcon, ...other } = props;
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
    } = useTreeItem2({ id, itemId, children, label, disabled, rootRef: ref });
    const theme = useTheme();

    const checkBoxProps = getCheckboxProps();
    const item = (publicAPI as any).getItem(itemId);

    const { draggable, onDragStart, onDragOver, onDragEnd, ...otherRootProps }: ReturnType<typeof getRootProps> = getRootProps(other);
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

    return (
        // To fix this error probably requires to upgrade to react 18.
        // @ts-ignore
        <TreeItem2Provider {...props} ref={ref} itemId={itemId}>
            <TreeItem2Root
                {...otherRootProps}
                sx={{
                    '& .MuiButtonBase-root': {
                        padding: '0px 8px',
                    },
                }}
            >
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
                    {checkBoxProps.visible && <MeltaCheckbox {...checkBoxProps} sxChecked={{ width: '18px', height: '18px' }} />}
                    {additionalRowIcon}
                    <LabelWithToolTip {...getLabelProps()} />
                    <TreeItem2DragAndDropOverlay {...getDragAndDropOverlayProps()} />
                </TreeItem2Content>
                {children && <TreeItem2GroupTransition {...getGroupTransitionProps()} />}
                {itemDepth === 0 && status.expandable && DivideMenuItems}
            </TreeItem2Root>
        </TreeItem2Provider>
    );
});

export default TreeItem;
