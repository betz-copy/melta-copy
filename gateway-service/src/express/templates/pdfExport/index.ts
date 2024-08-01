import { IPatch, Paragraph, patchDocument, PatchType, TextRun } from 'docx';
// eslint-disable-next-line import/no-extraneous-dependencies
import { IEntity } from '../../../externalServices/instanceService/interfaces/entities';

// const checkIfBold = (text: string) => {
//     return /<strong>(.*?)<\/strong>/.test(text);
// };

// const checkIfItalic = (text: string) => {
//     return /<em>(.*?)<\/em>/.test(text);
// };

// const checkIfUnderline = (text: string) => {
//     return /<u>(.*?)<\/u>/.test(text);
// };

// const checkIfStrike = (text: string) => {
//     return /<del>(.*?)<\/del>/.test(text);
// };

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

const createPatchesFromEntity = (entity: IEntity) => {
    const patches: Record<string, IPatch> = {};

    const props = entity.properties;
    Object.keys(props).forEach((_property) => {
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

        // // $('html, body, header').remove();

        // if (unorderedList.length !== 0 || orderedList.length !== 0) console.log({ orderedList, unorderedList, html: $.html(), paragraph });

        // if (typeof text === 'string') {
        //     const segments = getFieldSegments(props[property]);
        //     // const lists = extractLists(segments);
        //     const updatedHtmlArray = replaceListsWithItems(segments);
        //     // TODO this function does nothing (please fix omer pleaseeeee)
        //     createParagraphsFromLists(updatedHtmlArray, property);
        // }

        // patches[property] = {
        //     type: PatchType.PARAGRAPH,
        //     children: [
        //         new TextRun({ text: 'aaa' }),
        //         // new TextRun({ text: props[property], bold: checkIfBold(props[property]), italics: true, underline: {}, strike: true, break: 1 }),
        //     ],
        // };

        patches.firstName = {
            type: PatchType.DOCUMENT,

            children: [
                new Paragraph({
                    children: [new TextRun('Cyber')],
                    bullet: {
                        level: 1, // How deep you want the bullet to be. Maximum level is 9
                    },
                }),
                new Paragraph({
                    children: [new TextRun('Are awesome')],
                    bullet: {
                        level: 1,
                    },
                }),
            ],
        };
    });

    return patches;
};

export const patchDocumentAsStream = async (arrayBuffer: ArrayBuffer, entity: IEntity) => {
    return Buffer.from(await patchDocument(arrayBuffer, { patches: createPatchesFromEntity(entity) }));
};
