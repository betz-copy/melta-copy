import { useTheme } from '@mui/material';
import React from 'react';
import IconButtonWithPopover from './IconButtonWithPopover';

export const TableButton: React.FC<{
    iconButtonWithPopoverProps: React.ComponentProps<typeof IconButtonWithPopover>;
    icon?: React.ReactNode;
    text?: string;
    children?: React.ReactNode;
}> = ({ iconButtonWithPopoverProps, icon, text, children }) => {
    const theme = useTheme();

    return (
        <IconButtonWithPopover
            {...iconButtonWithPopoverProps}
            style={{
                ...(iconButtonWithPopoverProps.iconButtonProps?.style ?? {}),
                display: 'flex',
                gap: '0.25rem',
                borderRadius: '5px',
                fontSize: '0.75rem',
                color: theme.palette.primary.main,
            }}
        >
            {children ?? (
                <>
                    {icon}
                    {text}
                </>
            )}
        </IconButtonWithPopover>
    );
};
