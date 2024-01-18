import React from 'react';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton, Grid } from '@mui/material';
import { ColoredEnumChip } from '../../common/ColoredEnumChip';

const Value: React.FC<{ hideValue: boolean; value: string; color?: string; isNumberField?: boolean; useDefaultColoredEnum?: boolean }> = ({
    hideValue,
    value,
    color,
    isNumberField,
}) => {
    const [hideField, setHideField] = React.useState(true);
    const handleClick = () => {
        setHideField((curr) => !curr);
    };

    let innerContent = <></>;

    if (hideValue && hideField) innerContent = <>••••••••</>;
    else if (color || color === 'default') innerContent = <ColoredEnumChip label={value} color={color} />;
    else innerContent = <>{value}</>;

    return (
        <Grid container justifyContent="space-between" alignItems="center">
            <Grid
                item
                sx={{
                    fontFamily: 'Rubik',
                    fontSize: '16px',
                    fontWeight: '200',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    direction: isNumberField ? 'rtl' : undefined,
                }}
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
