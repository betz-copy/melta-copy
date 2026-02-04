import { Typography } from '@mui/material';
import { escapeRegExp } from 'lodash';
import React from 'react';
import { VerifyLink } from '../common/VerifyLink';

export const HighlightText: React.FC<{ text?: string | React.JSX.Element; searchedText?: string; color?: string; isLink?: boolean; sx?: object }> = ({
    text,
    searchedText,
    color,
    isLink = false,
    sx,
}) => {
    if ((typeof text !== 'string' && typeof text !== 'number') || !searchedText)
        return isLink ? (
            <VerifyLink color={color} sx={sx}>
                {text}
            </VerifyLink>
        ) : (
            <Typography color={color}>{text}</Typography>
        );

    const context = String(text)
        .split(new RegExp(`(${escapeRegExp(searchedText)})`, 'gi'))
        .map((part) => (part.toLowerCase() === searchedText.toLowerCase() ? <b key={part}>{part}</b> : part));

    return isLink ? (
        <VerifyLink color={color} sx={sx}>
            {context}
        </VerifyLink>
    ) : (
        <Typography component="span" color={color} sx={sx ? { sx } : {}}>
            {context}
        </Typography>
    );
};
