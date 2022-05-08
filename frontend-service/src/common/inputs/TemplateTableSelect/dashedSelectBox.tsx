import React from 'react';
import { Grid, Typography, Popover } from '@mui/material';

const DashedSelectBox: React.FC<{
    text: string;
    onClick: React.MouseEventHandler<HTMLDivElement>;
    disabled?: boolean;
    disabledReason?: string;
    error?: boolean;
    minHeight: React.CSSProperties['minHeight'];
}> = ({ text, onClick, disabled = false, disabledReason, error, minHeight }) => {
    const [disabledReasonIsOpen, setDisabledReasonIsOpen] = React.useState(false);
    const disabledReasonAnchorRef = React.useRef<HTMLParagraphElement>(null);

    const borderColorTheme = error ? 'error' : 'primary';

    const disabledModeOnClick: React.MouseEventHandler<HTMLDivElement> = () => {
        setDisabledReasonIsOpen(true);
    };

    return (
        <div>
            <Grid
                container
                onClick={disabled ? disabledModeOnClick : onClick}
                justifyContent="center"
                alignItems="center"
                sx={{
                    border: 'dashed',
                    ':hover': { borderColor: disabled ? undefined : `${borderColorTheme}.main` }, // if disabled, dont change borderColor on hover
                    borderColor: `${borderColorTheme}.light`,
                    cursor: 'pointer',
                    minHeight,
                }}
            >
                <Grid item>
                    <Typography ref={disabledReasonAnchorRef} component="p" variant="h4" color={disabled ? 'gray' : 'primary'}>
                        {text}
                    </Typography>
                </Grid>
            </Grid>
            <Popover
                open={disabledReasonIsOpen}
                onClose={() => setDisabledReasonIsOpen(false)}
                anchorEl={disabledReasonAnchorRef.current}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                disableRestoreFocus
            >
                <Typography variant="body1" textAlign="center" padding="5px">
                    {disabledReason}
                </Typography>
            </Popover>
        </div>
    );
};

export default DashedSelectBox;
