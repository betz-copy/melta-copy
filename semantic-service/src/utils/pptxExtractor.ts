import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';

interface XMLObject {
    [key: string]: any;
}
interface Relationship {
    $: {
        Id: string;
        Type: string;
        Target: string;
    };
}
interface RelationshipsObject {
    Relationship: Relationship[];
}
interface RelsObject {
    Relationships?: RelationshipsObject;
}

/**
 * Recursively extracts text from a slide object, primarily from <a:t> tags.
 * @param {XMLObject} slideObj - The parsed XML slide object.
 * @returns {string} - The extracted slide text.
 */
export const extractTextFromSlide = (slideObj: XMLObject): string => {
    let slideText = '';

    const traverse = (obj: XMLObject) => {
        if (!obj || typeof obj !== 'object') return;

        if (obj['a:t']) {
            const textArray = Array.isArray(obj['a:t']) ? obj['a:t'] : [obj['a:t']];
            textArray.forEach((txt) => {
                if (typeof txt === 'string') {
                    slideText += `${txt} `;
                }
            });
        }

        Object.keys(obj).forEach((key) => {
            const val = obj[key];
            if (Array.isArray(val)) {
                val.forEach((child) => traverse(child));
            } else if (typeof val === 'object') {
                traverse(val);
            }
        });
    };

    traverse(slideObj);
    return `${slideText.trim()}\n`;
};

/**
 * Recursively extracts text from a SmartArt/diagram object.
 * Typical text tags include <dgm:t> and <a:t>.
 * @param {XMLObject} diagramObj - The parsed XML diagram object.
 * @returns {string} - The extracted diagram text.
 */
const extractDiagramText = (diagramObj: XMLObject): string => {
    let diagramText = '';

    const traverse = (obj: XMLObject) => {
        if (!obj || typeof obj !== 'object') return;

        if (obj['dgm:t']) {
            const tArray = Array.isArray(obj['dgm:t']) ? obj['dgm:t'] : [obj['dgm:t']];
            tArray.forEach((txt) => {
                if (typeof txt === 'string') {
                    diagramText += `${txt} `;
                }
            });
        }

        if (obj['a:t']) {
            const aArray = Array.isArray(obj['a:t']) ? obj['a:t'] : [obj['a:t']];
            aArray.forEach((txt) => {
                if (typeof txt === 'string') {
                    diagramText += `${txt} `;
                }
            });
        }

        Object.keys(obj).forEach((key) => {
            const child = obj[key];
            if (Array.isArray(child)) {
                child.forEach((c) => traverse(c));
            } else if (typeof child === 'object') {
                traverse(child);
            }
        });
    };

    traverse(diagramObj);
    return `${diagramText.trim()}\n`;
};

/**
 * Normalizes a diagram path relative to the current slide path.
 * Because the Target attribute is relative to the slide folder,
 * we need to adjust it accordingly (e.g. "../diagrams/data1.xml").
 *
 * Example:
 *   slidePath = "ppt/slides/slide1.xml"
 *   target    = "../diagrams/data1.xml"
 * => returns  "ppt/diagrams/data1.xml"
 *
 * @param {string} slidePath
 * @param {string} target
 * @returns {string}
 */
const normalizeDiagramPath = (slidePath: string, target: string): string => {
    const baseDir = slidePath.substring(0, slidePath.lastIndexOf('/'));
    let upOne = baseDir.substring(0, baseDir.lastIndexOf('/'));
    const normalizedTarget = target.substring(3);
    upOne = upOne.substring(0, upOne.lastIndexOf('/')) || upOne;

    return `${upOne}/${normalizedTarget}`;
};

/**
 * Finds any "diagramData" relationships in the slide's .rels file.
 * @param {RelsObject} relsObj - The parsed .rels XML object.
 * @returns {string[]} - Array of diagram file paths.
 */
const findDiagramFiles = (relsObj: RelsObject): string[] => {
    const relationships = relsObj?.Relationships?.Relationship;
    if (!relationships) return [];

    return relationships
        .filter((rel) => rel.$.Type === 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagramData')
        .map((rel) => rel.$.Target);
};

/**
 * Extracts all text (including SmartArt/diagram text) from a PPTX file.
 * @param {Buffer} fileBuffer - The PPTX file data as a buffer.
 * @returns {Promise<string>} - The combined text from all slides.
 */
export const extractPptxText = async (fileBuffer: Buffer): Promise<string> => {
    const zip = await JSZip.loadAsync(fileBuffer);
    const slideFilePaths = Object.keys(zip.files).filter((path) => /^ppt\/slides\/slide\d+\.xml$/i.test(path));

    const slideTexts = await Promise.all(
        slideFilePaths.map(async (slidePath) => {
            const slideXml = await zip.file(slidePath)!.async('string');
            const slideObj = await parseStringPromise(slideXml);

            let slideText = `\n###\n`;
            slideText += extractTextFromSlide(slideObj);

            const relsPath = `${slidePath.replace('slides/', 'slides/_rels/')}.rels`;
            if (zip.files[relsPath]) {
                const relsXml = await zip.file(relsPath)!.async('string');
                const relsObj = (await parseStringPromise(relsXml)) as RelsObject;

                const diagramTargets = findDiagramFiles(relsObj);

                await Promise.all(
                    diagramTargets.map(async (diagRel) => {
                        const diagAbsPath = normalizeDiagramPath(slidePath, diagRel);
                        if (zip.files[diagAbsPath]) {
                            const diagXml = await zip.file(diagAbsPath)!.async('string');
                            const diagObj = await parseStringPromise(diagXml);
                            slideText += extractDiagramText(diagObj);
                        }
                    }),
                );
            }

            return slideText;
        }),
    );

    return slideTexts.join('');
};
