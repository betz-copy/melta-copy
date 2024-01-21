import React from 'react';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton, Grid } from '@mui/material';
import { ColoredEnumChip } from '../../common/ColoredEnumChip';

const Value: React.FC<{
    hideValue: boolean;
    value: string;
    color?: string;
    isNumberField?: boolean;
    useDefaultColoredEnum?: boolean;
}> = ({ hideValue, value, color, isNumberField }) => {
    const [hideField, setHideField] = React.useState(true);
    const [wrapText, setWrapText] = React.useState(false);
    const handleClick = () => {
        setHideField((curr) => !curr);
    };

    let innerContent;
    if (hideValue && hideField) innerContent = <>••••••••</>;
    else if (color || color === 'default') innerContent = <ColoredEnumChip label={value} color={color} />;
    else innerContent = value;

    return (
        <Grid container justifyContent="space-between" alignItems="center" wrap={wrapText ? 'wrap' : 'nowrap'}>
            <Grid
                item
                sx={{
                    fontFamily: 'Rubik',
                    fontSize: '14px',
                    fontWeight: '200',
                    overflow: 'hidden',
                    whiteSpace: wrapText ? 'normal' : 'nowrap',
                    textOverflow: 'ellipsis',
                    direction: isNumberField ? 'rtl' : undefined,
                }}
                onDoubleClick={() => setWrapText(!wrapText)}
            >
                {innerContent}
            </Grid>

            {hideValue && (
                <Grid item>
                    <IconButton onClick={handleClick}>{hideField ? <VisibilityOff /> : <Visibility />}</IconButton>
                </Grid>
            )}
        </Grid>
    );
};

export { Value };
