import React from 'react';
import linkifyHtml from 'linkify-html';

export const getTextContent = (value: string, splitValueToLines = false) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = value;
    if (splitValueToLines) return tempDiv.textContent?.split('\n');
    return tempDiv.textContent;
};

export const getFirstLine = (value: string) => {
    const allText = getTextContent(value, true);
    return allText?.[0];
};

export const getNumLines = (value: string) => {
    const lines = getTextContent(value, true);
    const filteredLines = Array.isArray(lines) ? lines?.filter((line) => line.trim() && !line.trim().match(/^<p><br><\/p>$/)) : [];
    return filteredLines?.length ?? 0;
};

export const convertToPlainText = (html: string) => {
    const tempElement = document.createElement('div');
    tempElement.innerHTML = html;
    return tempElement.textContent || tempElement.innerText || '';
};

export const renderHTML = (value: string) => {
    const linkifiedHtml = linkifyHtml(value, { target: '_blank' });
    const styledHtml = linkifiedHtml.replace(/<a /g, '<a style="color: #166BD4;" ');
    // eslint-disable-next-line react/no-danger
    return <div dangerouslySetInnerHTML={{ __html: styledHtml }} />;
};

export const containsHTMLTags = (value: string) => /<[a-z][\s\S]*>/i.test(value);
