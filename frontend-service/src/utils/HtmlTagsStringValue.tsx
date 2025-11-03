import linkifyHtml from 'linkify-html';

const splitValueToLines = (value: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = value;
    return tempDiv.textContent?.split('\n');
};

export const getFirstLine = (value: string) => {
    const allText = splitValueToLines(value);
    return allText?.[0];
};

export const getNumLines = (value: string) => {
    const lines = splitValueToLines(value);
    const filteredLines = lines?.filter((line) => line.trim() && !line.trim().match(/^<p><br><\/p>$/));
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
    return <div dangerouslySetInnerHTML={{ __html: styledHtml }} />;
};

export const containsHTMLTags = (value: string) => /<[a-z][\s\S]*>/i.test(value);
