import { Paragraph, patchDocument, PatchType, TextRun } from 'docx';
import { Readable, Transform } from 'stream';
import { IEntity } from '../../../externalServices/instanceService/interfaces/entities';
import logger from '../../../utils/logger/logsLogger';

const checkIfBold = (text: string) => {
    const boldTagRegex = /<strong>(.*?)<\/strong>/;

    let isBold = false;

    if (boldTagRegex.test(text)) {
        isBold = true;
    }

    return isBold;
};

const getFieldSegments = (field: string): string[] => {
    const listRegex = /<ol>(.*?)<\/ol>/gs;
    const listMatches = [...field.matchAll(listRegex)];
    const segments: string[] = [];
    let lastIndex = 0;

    listMatches.forEach((listMatch) => {
        const listBlock = listMatch[0];
        const listStartIndex = listMatch.index;

        if (listStartIndex !== undefined && lastIndex < listStartIndex) {
            segments.push(field.slice(lastIndex, listStartIndex).trim());
        }

        segments.push(listBlock.trim());

        if (listStartIndex !== undefined) {
            lastIndex = listStartIndex + listBlock.length;
        }
    });

    if (lastIndex < field.length) {
        segments.push(field.slice(lastIndex).trim());
    }

    return segments;
};

const extractLists = (htmlArray: string[]): string[] => {
    const listRegex = /<ol[\s\S]*?<\/ol>|<ul[\s\S]*?<\/ul>/g;
    return htmlArray.flatMap((html) => html.match(listRegex) || []);
};

const extractListItems = (list: string): string[] => {
    const listItemRegex = /<li[\s\S]*?<\/li>/g;
    return list.match(listItemRegex) || [];
};

const extractListItemsFromArray = (list: string[]): string[] => {
    const listItemRegex = /<li[\s\S]*?<\/li>/g;
    return list.filter((item) => item.match(listItemRegex)) || [];
};

const replaceListsWithItems = (htmlArray: string[]): string[] => {
    return htmlArray.flatMap((html) => {
        const lists = extractLists([html]);
        if (lists.length > 0) {
            return lists.flatMap(extractListItems);
        }
        return [html];
    });
};

const createParagraphsFromLists = (list: string[], propertyName: string) => {
    const documentChildren: Paragraph[] = [];

    const listItems = extractListItemsFromArray(list);
    listItems.forEach((item) => {
        const cleanItem = item.replace(/<\/?li>/g, '');

        const level = 0;
        const numberingReference = propertyName;

        documentChildren.push(
            new Paragraph({
                text: cleanItem,
                numbering: {
                    reference: numberingReference,
                    level,
                },
            }),
        );
    });
};

const createPatchesFromEntity = (entity: IEntity) => {
    const patches: any = {};

    const props = entity.properties;
    Object.keys(props).forEach((property) => {
        if (typeof props[property] === 'string') {
            const segments = getFieldSegments(props[property]);
            // const lists = extractLists(segments);
            const updatedHtmlArray = replaceListsWithItems(segments);
            createParagraphsFromLists(updatedHtmlArray, property);
        }

        patches[property] = {
            type: PatchType.PARAGRAPH,
            children: [new TextRun({ text: props[property], bold: checkIfBold(props[property]) })],
        };
    });

    return patches;
};

export const patchDocumentAsStream = async (fileStream: Readable, entity: IEntity): Promise<Readable> => {
    const transformStream = new Transform({
        async transform(chunk, _encoding, callback) {
            try {
                const patches = createPatchesFromEntity(entity);
                const patchedBuffer = await patchDocument(chunk, { patches });
                this.push(patchedBuffer);
                callback();
            } catch (error: any) {
                logger.error('\n\n\nError patching document:', error, '\n\n\n');
                callback(error);
            }
        },
    });

    fileStream.pipe(transformStream);

    return transformStream;
};
