/* eslint-disable import/prefer-default-export */
import JSZip from 'jszip';
import config from '../../../config';
import { extractTextByTags, findDiagramFiles, normalizeDiagramPath, RelsObject, readXmlFromZip, XMLObject } from './helperFunctions';

const { slidesSplitter, slidesPathRegex, extractingTextTags, extractingDiagramTags } = config.minio.pptx;

/**
 * Reads a slide's .rels file to find SmartArt/diagram references and extracts their text.
 * @param presentationZip - The JSZip instance for the PPTX file (presentation).
 * @param slidePath - The path to the slide XML (used to derive .rels path).
 */
const readDiagramReferences = async (presentationZip: JSZip, slidePath: string): Promise<string> => {
    let diagramText = '';
    const relsPath = `${slidePath.replace('slides/', 'slides/_rels/')}.rels`;
    if (!presentationZip.files[relsPath]) return diagramText;

    const relsObj = await readXmlFromZip<RelsObject>(presentationZip, relsPath);

    const diagramTargets = findDiagramFiles(relsObj);

    await Promise.all(
        diagramTargets.map(async (diagRel) => {
            const diagAbsPath = normalizeDiagramPath(slidePath, diagRel);

            if (presentationZip.files[diagAbsPath]) {
                const diagObj = await readXmlFromZip<XMLObject>(presentationZip, diagAbsPath);
                diagramText += extractTextByTags(diagObj, extractingDiagramTags);
            }
        }),
    );

    return diagramText;
};

/**
 * Reads a single slide from the ZIP, extracts all text, and appends diagram text if available.
 * @param presentationZip - The JSZip instance for the PPTX file (presentation).
 * @param slidePath - The path to the slide XML (e.g., 'ppt/slides/slide1.xml').
 * @param index - The slide index (for labeling).
 */
const readSlide = async (presentationZip: JSZip, slidePath: string): Promise<string> => {
    const slideObj = await readXmlFromZip<XMLObject>(presentationZip, slidePath);
    let slideText = '';

    slideText += extractTextByTags(slideObj, extractingTextTags);

    slideText += await readDiagramReferences(presentationZip, slidePath);

    return slideText;
};

/**
 * Extracts all text (including SmartArt/diagram text) from a PPTX file.
 * @param {Buffer} fileBuffer - The PPTX file data as a buffer.
 * @returns {Promise<string>} - The combined text from all slides.
 */
export const extractPptxText = async (fileBuffer: Buffer): Promise<string> => {
    const presentationZip = await JSZip.loadAsync(fileBuffer);
    const slidesPathCheckRegex = new RegExp(slidesPathRegex, 'i');
    const slideFilePaths = Object.keys(presentationZip.files).filter((path) => slidesPathCheckRegex.test(path));

    const slideTexts = await Promise.all(slideFilePaths.map((slidePath) => readSlide(presentationZip, slidePath)));

    return slideTexts.join(slidesSplitter);
};
