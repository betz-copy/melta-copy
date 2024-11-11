import React from 'react';

export const HighlightText: React.FC<{ text: unknown; searchedText?: string }> = ({ text, searchedText }) => {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    if ((typeof text !== 'string' && typeof text !== 'number') || !searchedText) return <>{text}</>;

    return (
        <span>
            {String(text)
                .split(new RegExp(`(${searchedText})`, 'gi'))
                .map((part) => (part.toLowerCase() === searchedText.toLowerCase() ? <b key={part}>{part}</b> : part))}
        </span>
    );
};
