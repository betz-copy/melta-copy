import React, { useEffect, useState } from 'react';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton, Grid, Popover, Typography } from '@mui/material';
import i18next from 'i18next';
import { ColoredEnumChip } from '../../common/ColoredEnumChip';
import { VerifyLink } from '../../common/VerifyLink';
import { getFirstLine, getNumLines, containsHTMLTags, renderHTML } from '../HtmlTagsStringValue';
import { CalculateDateDifference } from './CalculateDateDifference';

const Value: React.FC<{
    hideValue: boolean;
    value: string;
    color?: string;
    isNumberField?: boolean;
    calculateTime?: boolean;
}> = ({ hideValue, value, color, isNumberField, calculateTime }) => {
    const containsHtmlTags = containsHTMLTags(value);
    const [hideField, setHideField] = React.useState(true);
    const [anchorEl, setAnchorEl] = React.useState<HTMLDivElement | HTMLButtonElement | null>(null);
    const [numLines, setNumLines] = useState(0);

    useEffect(() => {
        if (containsHtmlTags) {
            const totalNumLines = getNumLines(value);
            setNumLines(totalNumLines);
        }
    }, [containsHtmlTags, value]);

    const handleClick = () => {
        setHideField((curr) => !curr);
    };

    const handleDoubleClick = (event: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    let innerContent;
    if (hideValue && hideField) innerContent = <>••••••••</>;
    else if (color || color === 'default') innerContent = <ColoredEnumChip label={value} color={color} />;
    else if (containsHtmlTags) innerContent = getFirstLine(value);
    else if (calculateTime && value) innerContent = <CalculateDateDifference date={value} />;
    else innerContent = value;

    let popoverText;
    if (containsHtmlTags) popoverText = renderHTML(value);
    else if (calculateTime) popoverText = <CalculateDateDifference date={value} />;
    else popoverText = <VerifyLink>{value} </VerifyLink>;

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
                <VerifyLink>{innerContent}</VerifyLink>
                {(!hideValue || !hideField) && numLines > 1 && (
                    <IconButton onClick={handleDoubleClick} disableRipple>
                        <Typography style={{ color: '#9398C2', fontSize: '13px', lineHeight: '11.85px' }}>{i18next.t('actions.viewMore')}</Typography>
                    </IconButton>
                )}
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
                        whiteSpace: containsHtmlTags ? 'normal' : 'pre-wrap',
                        fontWeight: 200,
                        fontSize: '15px',
                    }}
                >
                    {popoverText}
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
