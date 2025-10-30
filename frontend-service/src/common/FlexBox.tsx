import { Stack, StackProps, useTheme } from '@mui/material';
import React, { forwardRef } from 'react';

export interface FlexBoxProps extends StackProps {
    direction?: 'row' | 'column';
    shrink?: boolean;
}

const FlexBox = forwardRef<HTMLDivElement, FlexBoxProps>(({ gap, direction, sx, shrink, ...props }, ref) => {
    const theme = useTheme();

    const flexDirection = direction || 'row';

    const { gap: sxGap, ...sxRest } = sx && 'gap' in sx ? sx : { gap: undefined, ...sx };
    const flexGap = gap || sxGap;
    const spacing = typeof flexGap === 'number' ? theme.spacing(flexGap) : flexGap ? String(flexGap) : flexGap;
    const gapStyles = { row: { marginInlineEnd: spacing }, column: { marginBottom: spacing } };

    const shrinkStyles = shrink ? { minWidth: 0, minHeight: 0 } : {};

    return (
        <Stack
            {...props}
            ref={ref}
            direction={flexDirection}
            sx={{ ...sxRest, '&>*:not(:last-child)': gapStyles[flexDirection] }}
            {...shrinkStyles}
        />
    );
});

export default FlexBox;
