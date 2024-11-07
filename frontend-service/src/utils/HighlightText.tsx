import React from 'react';

export const HighlightText: React.FC<{ text: string; searchedText?: string }> = ({ text, searchedText }) => {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    if (typeof text !== 'string' || !searchedText) return <>{text}</>;

    return (
        <span>
            {text
                .split(new RegExp(`(${searchedText})`, 'gi'))
                .map((part) => (part.toLowerCase() === searchedText.toLowerCase() ? <b key={part}>{part}</b> : part))}
        </span>
    );
};
