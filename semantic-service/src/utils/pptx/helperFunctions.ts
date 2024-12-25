import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';
import config from '../../config';

const { extractingTextTags, extractingDiagramTags, diagramTypesToFilterBy } = config.minio.pptx;

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

export interface RelsObject {
    Relationships?: RelationshipsObject;
}
export interface XMLObject {
    [key: string]: any;
}

/**
 * Recursively extracts text from a given XML object by the specified tag names.
 *
 * @param {XMLObject} obj - Parsed XML object to traverse.
 * @param {string[]} tags - List of tag names to extract (e.g. ["a:t"], ["a:t", "dgm:t"]).
 * @returns {string} The extracted text, concatenated with spaces.
 */
const extractTextByTags = (obj: XMLObject, tags: string[]): string => {
    let accumulatedText = '';

    const traverse = (node: XMLObject) => {
        if (!node || typeof node !== 'object') return;

        tags.forEach((tag) => {
            if (node[tag]) {
                const tagValues = Array.isArray(node[tag]) ? node[tag] : [node[tag]];

                tagValues.forEach((val) => {
                    if (typeof val === 'string') {
                        accumulatedText += `${val} `;
                    }
                });
            }
        });

        Object.keys(node).forEach((key) => {
            const child = node[key];

            if (Array.isArray(child)) {
                child.forEach((c) => traverse(c));
            } else if (typeof child === 'object') {
                traverse(child);
            }
        });
    };

    traverse(obj);

    return `${accumulatedText.trim()}\n`;
};

/**
 * Recursively extracts text from a slide object, primarily from <a:t> tags.
 * @param {XMLObject} slideObj - The parsed XML slide object.
 * @returns {string} - The extracted slide text.
 */
export const extractTextFromSlide = (slideObj: XMLObject): string => extractTextByTags(slideObj, extractingTextTags);

/**
 * Recursively extracts text from a SmartArt/diagram object.
 * Typical text tags include <dgm:t> and <a:t>.
 * @param {XMLObject} diagramObj - The parsed XML diagram object.
 * @returns {string} - The extracted diagram text.
 */
export const extractDiagramText = (diagramObj: XMLObject): string => extractTextByTags(diagramObj, extractingDiagramTags);

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
export const normalizeDiagramPath = (slidePath: string, target: string): string => {
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
export const findDiagramFiles = (relsObj: RelsObject): string[] => {
    const relationships = relsObj?.Relationships?.Relationship;
    if (!relationships) return [];

    return relationships.filter((rel) => diagramTypesToFilterBy.includes(rel.$.Type)).map((rel) => rel.$.Target);
};

/**
 * Reads an XML file from a ZIP archive and parses it.
 * @param zip - The JSZip instance for the ZIP archive.
 * @param filePath - The path to the XML file within the ZIP archive.
 * @returns The parsed XML object.
 */
export const readXmlFromZip = async <T>(zip: JSZip, filePath: string): Promise<T> => {
    const xml = await zip.file(filePath)!.async('string');
    const obj = (await parseStringPromise(xml)) as T;

    return obj;
};
