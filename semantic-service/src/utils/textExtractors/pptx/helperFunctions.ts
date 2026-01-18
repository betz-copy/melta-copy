import { posix as path } from 'node:path';
import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';
import config from '../../../config';

const { diagramTypesToFilterBy } = config.minio.pptx;

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
    [key: string]: string;
}

/**
 * Recursively extracts text from a given XML object by the specified tag names.
 *
 * @param {XMLObject} obj - Parsed XML object to traverse.
 * @param {string[]} tags - List of tag names to extract (e.g. ["a:t"], ["a:t", "dgm:t"]).
 * @returns {string} The extracted text, concatenated with spaces.
 */
export const extractTextByTags = (obj: XMLObject, tags: string[]): string => {
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
                child.forEach((c) => {
                    traverse(c);
                });
            } else if (typeof child === 'object') traverse(child);
        });
    };

    traverse(obj);

    return `${accumulatedText.trim()}\n`;
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
export const normalizeDiagramPath = (slidePath: string, target: string): string => {
    // Get the directory of the slide (e.g., "ppt/slides")
    const slideDir = path.dirname(slidePath);

    // Join with the relative target (e.g., "../diagrams/data1.xml")
    // This produces "ppt/diagrams/data1.xml"
    return path.join(slideDir, target);
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
