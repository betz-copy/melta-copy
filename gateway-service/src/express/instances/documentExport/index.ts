/* eslint-disable import/prefer-default-export */
import { IEntity, IMongoEntityTemplatePopulated } from '@microservices/shared';
import { load } from 'cheerio';
import { ImageRun, IPatch, patchDocument, PatchType, TextRun } from 'docx';
import { toHebrewJewishDate, toJewishDate } from 'jewish-date';
import mammoth from 'mammoth';
import config from '../../../config';

const {
    service: { jewishDateIndicator, hebrewDateIndicator, maxPatchIterations },
    hebrew: { yes, no },
} = config;

// ! This is commented because this code will be used in the future, it's just not ready right now. contact Rozner about continuing it.
// const getFieldSegments = (field: string): string[] => {
//     const listRegex = /<ol>(.*?)<\/ol>/gs;
//     const listMatches = [...field.matchAll(listRegex)];
//     const segments: string[] = [];
//     let lastIndex = 0;

//     listMatches.forEach((listMatch) => {
//         const listBlock = listMatch[0];
//         const listStartIndex = listMatch.index;

//         if (listStartIndex !== undefined && lastIndex < listStartIndex) {
//             segments.push(field.slice(lastIndex, listStartIndex).trim());
//         }

//         segments.push(listBlock.trim());

//         if (listStartIndex !== undefined) {
//             lastIndex = listStartIndex + listBlock.length;
//         }
//     });

//     if (lastIndex < field.length) {
//         segments.push(field.slice(lastIndex).trim());
//     }

//     return segments;
// };

// const extractLists = (htmlArray: string[]): string[] => {
//     const listRegex = /<ol[\s\S]*?<\/ol>|<ul[\s\S]*?<\/ul>/g;
//     return htmlArray.flatMap((html) => html.match(listRegex) || []);
// };

// const extractListItems = (list: string): string[] => {
//     const listItemRegex = /<li[\s\S]*?<\/li>/g;
//     return list.match(listItemRegex) || [];
// };

// const extractListItemsFromArray = (list: string[]): string[] => {
//     const listItemRegex = /<li[\s\S]*?<\/li>/g;
//     return list.filter((item) => item.match(listItemRegex)) || [];
// };

// const replaceListsWithItems = (htmlArray: string[]): string[] => {
//     return htmlArray.flatMap((html) => {
//         const lists = extractLists([html]);
//         if (lists.length > 0) {
//             return lists.flatMap(extractListItems);
//         }
//         return [html];
//     });
// };

// const createParagraphsFromLists = (list: string[], propertyName: string) => {
//     return extractListItemsFromArray(list).map((item) => {
//         return new Paragraph({
//             text: item.replace(/<\/?li>/g, ''),
//             numbering: {
//                 reference: propertyName,
//                 level: 0,
//             },
//         });
//     });
// };

// TODO: Extract complicated text additions from html (such as bold, lists etc).
// const extractTypographicalEmphasisFromHtml = (text: string) => {
// const text = props[property];
// const $ = load(text);
// const extractListItems = (list) => {
//     return $(list)
//         .find('li')
//         .map((_i, el) => $(el).html())
//         .get();
// };
// const orderedList: string[][] = [];
// const unorderedList: string[][] = [];
// const paragraph: TextRun[][] = [];
// // const kaki: any = [];
// $('ol').each((_i, el) => {
//     orderedList.push(extractListItems(el));
//     $(el).replaceWith('<!--ORDERED_LIST_PLACEHOLDER-->');
// });
// $('ul').each((_i, el) => {
//     unorderedList.push(extractListItems(el));
//     $(el).replaceWith('<!--UNORDERED_LIST_PLACEHOLDER-->');
// });
// $('p').each((_i, el) => {
//     const content = $(el).html();
//     if (content) {
//         const currentP: TextRun[] = [];
//         let children = $(el).contents();
//         let aaa = 0;
//         while (children.length !== 0 && aaa < 10) {
//             children.each((_in, elm) => {
//                 if (!$(elm).html()) {
//                     currentP.push(
//                         new TextRun({
//                             text: $(elm).text(),
//                             bold: $(elm).is('strong'),
//                             italics: $(elm).is('em'),
//                             underline: $(elm).is('u') ? {} : undefined,
//                             strike: $(elm).is('del'),
//                         }),
//                     );
//                 }
//             });
//             children = children.filter((_, c) => !!$(c).html());
//             aaa += 1;
//         }
//         paragraph.push(currentP);
//         $(el).replaceWith('<!--PARAGRAPH_PLACEHOLDER-->');
//     }
// });
// };

const getJewishDate = (dateStr: string) => {
    const { day, monthName, year } = toHebrewJewishDate(toJewishDate(new Date(dateStr)));

    return `${day} ב${monthName} ${year}`;
};

const getHebrewDate = (dateStr: string) =>
    new Intl.DateTimeFormat('he', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(dateStr));

/**
 * Checks if string text contains html tags.
 * @param text contains or not html tags
 * @returns true if contains html tags. Otherwise, false.
 */
const isHTML = (text: string): boolean => {
    const $ = load(text);
    return $('body').children().length > 0;
};

/**
 * Extracts text from html tag.
 * @param html html like string that contains html tag with text.
 * @returns trimmed text from the tag.
 */
const extractTextFromHtml = (html: string, htmlTag: string = 'p'): string => {
    // Load the html value to jQuery like html trimmer
    const $ = load(html);

    // Simple html text element. The first element is the
    // extracted text for single element such as this.
    const htmlElement = $(htmlTag)[0];

    // Return the text value of the element.
    return $(htmlElement).text() ?? html;
};

const ISODateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/;
const regularDateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Checks if string is in date format (YYYY-MM-DDTHH:MN:SS.MSSZ)
 * @param strDate string that may be date
 * @returns true if the string is in the form of date. Otherwise, false.
 */
const isDateWithTime = (strDate: string): boolean => {
    if (!ISODateRegex.test(strDate)) return false;
    const date = new Date(strDate);
    return date instanceof Date && !Number.isNaN(date.getTime()) && date.toISOString() === strDate; // valid date
};

/**
 *
 * @param strDate string that may be date
 * @returns true if the string is in the form of date. Otherwise, false.
 */
const isDateWithoutTime = (strDate: string): boolean => {
    if (!regularDateRegex.test(strDate)) return false;
    const date = new Date(strDate);
    const [year, month, day] = strDate.split('-').map(Number);
    return !Number.isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
};

/**
 * Creates document patches from an entity's properties.
 *
 * @param {IEntity} entity - The entity containing properties to be converted into patches.
 * @returns {Record<string, IPatch>} - A record of patches created from the entity's properties.
 */
const createPatchesFromEntity = async (
    properties: IEntity['properties'],
    entityTemplate: IMongoEntityTemplatePopulated,
    getFilePreview: (path: string, contentType?: string) => Promise<Buffer>,
): Promise<Record<string, IPatch>> => {
    const patches: Record<string, IPatch> = {};

    // Extract keys of properties that are date strings
    const datePropertyKeys = Object.entries(properties)
        .filter(([_, value]) => typeof value === 'string' && (isDateWithTime(value) || isDateWithoutTime(value)))
        .map(([key]) => key);

    // Create a new object with Jewish date properties added
    const propertiesWithHebrewDates = datePropertyKeys.reduce(
        (acc, datePropertyKey) => {
            const dateValue = properties[datePropertyKey];
            acc[`${datePropertyKey}${jewishDateIndicator}`] = getJewishDate(dateValue);
            acc[`${datePropertyKey}${hebrewDateIndicator}`] = getHebrewDate(dateValue);
            return acc;
        },
        { ...properties },
    );

    // Iterate over each property in the entity
    await Promise.all(
        Object.entries(propertiesWithHebrewDates).map(async ([key, value]) => {
            const trimmedValue: string = isHTML(String(value)) ? extractTextFromHtml(value) : value;
            const templateProperty = entityTemplate.properties.properties[key];
            if (templateProperty && templateProperty.format === 'signature') {
                try {
                    const imageBuffer = await getFilePreview(trimmedValue, 'image');

                    patches[key] = {
                        type: PatchType.PARAGRAPH,
                        children: [
                            new ImageRun({
                                data: imageBuffer,
                                transformation: {
                                    width: 95,
                                    height: 70,
                                },
                            }),
                        ],
                    };
                } catch {
                    patches[key] = {
                        type: PatchType.PARAGRAPH,
                        children: [new TextRun(String(trimmedValue))],
                    };
                }
            } else {
                let formattedValue = trimmedValue;

                if (typeof trimmedValue === 'string' && isDateWithTime(trimmedValue))
                    formattedValue = `${new Date(formattedValue).toLocaleDateString('he')}, ${new Date(formattedValue).toLocaleTimeString('he')}`;
                if (typeof trimmedValue === 'boolean') formattedValue = formattedValue ? yes : no;
                if (Array.isArray(trimmedValue)) formattedValue = trimmedValue.join(', ');

                patches[key] = {
                    type: PatchType.PARAGRAPH,
                    children: [new TextRun(String(formattedValue))],
                };
            }
        }),
    );

    return patches;
};

const arePatchesEqual = (firstPatchDocument: Uint8Array, secondPatchDocument: Uint8Array) =>
    firstPatchDocument.toString() === secondPatchDocument.toString();

export const patchDocumentAsStream = async (
    arrayBuffer: ArrayBuffer,
    properties: IEntity['properties'],
    entityTemplate: IMongoEntityTemplatePopulated,
    getFilePreview: (path: string, contentType?: string) => Promise<Buffer>,
) => {
    const patches = await createPatchesFromEntity(properties, entityTemplate, getFilePreview);

    // Due to the fact that 'patchDocument' function can patch only one instance of a string per patch,
    // we need to check if the document can no longer change with the patches
    let patchedDocument = await patchDocument(arrayBuffer, { patches, keepOriginalStyles: true });
    let newPatchedDocument = await patchDocument(patchedDocument, { patches, keepOriginalStyles: true });

    // Prevent infinite loop and re-patch while there are patches.
    for (
        let patchIterations = 0;
        patchIterations < maxPatchIterations && arePatchesEqual(patchedDocument, newPatchedDocument);
        patchIterations += 1
    ) {
        patchedDocument = newPatchedDocument;
        // eslint-disable-next-line no-await-in-loop
        newPatchedDocument = await patchDocument(patchedDocument, { patches, keepOriginalStyles: true });
    }

    // Extract keys to delete from the document by matching the pattern {{.*?}} in the raw text
    // ? don't ask about the buffer that gets an arrayBuffer, this lib is stupid
    const buffer = Buffer.from(arrayBuffer);
    const keysToDelete = (await mammoth.extractRawText({ buffer })).value
        .match(/{{.*?}}/g) // Match all occurrences of {{key}} in the document
        ?.map((patch) => patch.replace(/{{|}}/g, '')) // Remove the curly braces from the matched keys
        ?.filter((patch) => !(patch in properties)); // Filter out keys that are present in the properties

    if (keysToDelete) {
        // Create new patches to delete the keys
        const emptyPatches: Record<string, IPatch> = Object.fromEntries(
            keysToDelete?.map((patch) => [patch, { type: PatchType.PARAGRAPH, children: [new TextRun('')] }]),
        );
        // Apply the new patches to the document
        patchedDocument = await patchDocument(patchedDocument, { patches: emptyPatches, keepOriginalStyles: true });
    }

    return Buffer.from(patchedDocument);
};
