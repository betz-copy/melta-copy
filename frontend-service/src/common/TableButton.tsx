import { useTheme } from '@mui/material';
import React from 'react';
import { useDarkModeStore } from '../stores/darkMode';
import IconButtonWithPopover from './IconButtonWithPopover';

export const TableButton: React.FC<{
    iconButtonWithPopoverProps: React.ComponentProps<typeof IconButtonWithPopover>;
    icon?: React.ReactNode;
    text?: string;
    children?: React.ReactNode;
    disableButton?: boolean;
}> = ({ iconButtonWithPopoverProps, icon, text, children, disableButton }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const theme = useTheme();

    const disabledColor = darkMode ? 'rgba(255, 255, 255, 0.26)' : 'rgba(0, 0, 0, 0.26)';

    return (
        <IconButtonWithPopover
            {...iconButtonWithPopoverProps}
            style={{
                display: 'flex',
                gap: '0.25rem',
                borderRadius: '5px',
                fontSize: '0.75rem',
                color: disableButton ? disabledColor : theme.palette.primary.main,

                ...(iconButtonWithPopoverProps.iconButtonProps?.style ?? {}),
            }}
            disabled={disableButton}
            buttonStyle={{ ':hover': { textDecoration: 'underline' } }}
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
