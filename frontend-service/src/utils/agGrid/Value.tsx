import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Grid, IconButton, Popover, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { ColoredEnumChip } from '../../common/ColoredEnumChip';
import { VerifyLink } from '../../common/VerifyLink';
import { HighlightText } from '../HighlightText';
import { containsHTMLTags, getFirstLine, getNumLines, renderHTML } from '../HtmlTagsStringValue';
import { getFixedNumber, isStartWithHebrewLetter } from '../stringValues';
import { CalculateDateDifference } from './CalculateDateDifference';

const Value: React.FC<{
    hideValue: boolean;
    value: string;
    enumColor?: string;
    color?: string;
    calculateTime?: boolean;
    isNumberField?: boolean;
    searchValue?: string;
}> = ({ hideValue, value, enumColor, color, calculateTime, isNumberField, searchValue }) => {
    const containsHtmlTags = containsHTMLTags(value);
    const [hideField, setHideField] = useState<boolean>(true);
    const [anchorEl, setAnchorEl] = useState<HTMLDivElement | HTMLButtonElement | null>(null);
    const [numLines, setNumLines] = useState<number>(0);

    useEffect(() => {
        if (containsHtmlTags) {
            const totalNumLines = getNumLines(value);
            setNumLines(totalNumLines);
        }
    }, [containsHtmlTags, value]);

    const handleClick = () => setHideField((curr) => !curr);

    const handleDoubleClick = (event: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => setAnchorEl(event.currentTarget);

    const handleClose = () => setAnchorEl(null);

    const open = Boolean(anchorEl);

    let innerContent: string | React.JSX.Element | undefined;

    if (hideValue && hideField) innerContent = <>••••••••</>;
    else if (enumColor || enumColor === 'default')
        innerContent = <ColoredEnumChip label={value} color={enumColor} searchValue={searchValue} textOverrideColor={color} />;
    else if (containsHtmlTags) innerContent = getFirstLine(value);
    else if (calculateTime && value) innerContent = <CalculateDateDifference date={value} searchValue={searchValue} />;
    else if (isNumberField && value) innerContent = getFixedNumber(Number(value));
    else innerContent = value;

    let popoverText;

    if (containsHtmlTags) popoverText = renderHTML(value);
    else if (calculateTime) popoverText = <CalculateDateDifference date={value} />;
    else popoverText = <VerifyLink color={color}>{value} </VerifyLink>;

    const textDirection = containsHtmlTags || calculateTime ? true : isStartWithHebrewLetter(value);

    return (
        <Grid container justifyContent="space-between" alignItems="center">
            <Grid
                sx={{
                    fontFamily: 'Rubik',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    direction: textDirection ? 'ltr' : 'rtl',
                }}
                onDoubleClick={handleDoubleClick}
            >
                <HighlightText text={innerContent} searchedText={searchValue} isLink color={color} />
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
                        direction: textDirection ? 'rtl' : 'ltr',
                        color,
                    }}
                >
                    {popoverText}
                </div>
            </Popover>

            {hideValue && (
                <Grid>
                    <IconButton onClick={handleClick}>
                        {hideField ? <VisibilityOff style={{ color: '#9398C2' }} /> : <Visibility style={{ color: '#9398C2' }} />}
                    </IconButton>
                </Grid>
            )}
        </Grid>
    );
};

export { Value };
