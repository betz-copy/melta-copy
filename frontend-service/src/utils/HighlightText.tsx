import { escapeRegExp } from 'lodash';
import React from 'react';
import { VerifyLink } from '../common/VerifyLink';

export const HighlightText: React.FC<{ text?: string | React.JSX.Element; searchedText?: string }> = ({ text, searchedText }) => {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    if ((typeof text !== 'string' && typeof text !== 'number') || !searchedText) return <VerifyLink>{text}</VerifyLink>;

    return (
        <VerifyLink>
            {String(text)
                .split(new RegExp(`(${escapeRegExp(searchedText)})`, 'gi'))
                .map((part) => (part.toLowerCase() === searchedText.toLowerCase() ? <b key={part}>{part}</b> : part))}
        </VerifyLink>
    );
};
