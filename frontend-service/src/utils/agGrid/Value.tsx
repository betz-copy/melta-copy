import React from 'react';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton, Grid, Popover } from '@mui/material';
import { ColoredEnumChip } from '../../common/ColoredEnumChip';

const Value: React.FC<{
    hideValue: boolean;
    value: string;
    color?: string;
    isNumberField?: boolean;
}> = ({ hideValue, value, color, isNumberField }) => {
    const [hideField, setHideField] = React.useState(true);
    const [anchorEl, setAnchorEl] = React.useState<HTMLDivElement | null>(null);

    const handleClick = () => {
        setHideField((curr) => !curr);
    };

    const handleDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    let innerContent;
    if (hideValue && hideField) innerContent = <>••••••••</>;
    else if (color || color === 'default') innerContent = <ColoredEnumChip label={value} color={color} />;
    else innerContent = value;

    return (
        <Grid container justifyContent="space-between" alignItems="center">
            <Grid
                item
                sx={{
                    fontFamily: 'Rubik',
                    fontWeight: '200',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    direction: isNumberField ? 'rtl' : undefined,
                }}
                onDoubleClick={handleDoubleClick}
            >
                {innerContent}
            </Grid>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <div
                    style={{
                        padding: '10px',
                        maxWidth: '350px',
                        maxHeight: '200px',
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        fontWeight: 200,
                        fontSize: '15px',
                    }}
                >
                    {value}
                </div>
            </Popover>

            {hideValue && (
                <Grid item>
                    <IconButton onClick={handleClick}>
                        {hideField ? <VisibilityOff style={{ color: '#9398C2' }} /> : <Visibility style={{ color: '#9398C2' }} />}
                    </IconButton>
                </Grid>
            )}
        </Grid>
    );
};

export { Value };
