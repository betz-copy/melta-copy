import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';

export const extractTextFromSlide = (slideObj: any): string => {
    let slideText = '';

    function recurse(obj: any) {
        if (typeof obj !== 'object' || !obj) return;

        // Normal text in <a:t> (non-SmartArt shapes)
        if (obj['a:t']) {
            const textArr = Array.isArray(obj['a:t']) ? obj['a:t'] : [obj['a:t']];
            textArr.forEach((txt) => {
                if (typeof txt === 'string') slideText += `${txt} `;
            });
        }

        // Recurse into all children
        Object.keys(obj).forEach((key) => {
            const val = obj[key];
            if (Array.isArray(val)) {
                val.forEach((child) => recurse(child));
            } else if (typeof val === 'object' && val !== null) {
                recurse(val);
            }
        });
    }

    recurse(slideObj);
    return `${slideText.trim()}\n`;
};

/**
 * Extract text from a SmartArt diagram's XML (typical tags: <dgm:t> or <a:t>).
 */
const extractDiagramText = (diagramObj: any): string => {
    let diagramText = '';

    function recurse(obj: any) {
        if (!obj || typeof obj !== 'object') return;

        // SmartArt text is often in <dgm:t>...
        if (obj['dgm:t']) {
            const val = Array.isArray(obj['dgm:t']) ? obj['dgm:t'] : [obj['dgm:t']];
            val.forEach((txt) => {
                if (typeof txt === 'string') diagramText += `${txt} `;
            });
        }
        // But sometimes also in <a:t> (depending on SmartArt type)
        if (obj['a:t']) {
            const val = Array.isArray(obj['a:t']) ? obj['a:t'] : [obj['a:t']];
            val.forEach((txt) => {
                if (typeof txt === 'string') diagramText += `${txt} `;
            });
        }

        // Recurse children
        Object.keys(obj).forEach((key) => {
            const child = obj[key];
            if (Array.isArray(child)) {
                child.forEach((c) => recurse(c));
            } else if (typeof child === 'object' && child !== null) {
                recurse(child);
            }
        });
    }

    recurse(diagramObj);
    // Return a small prefix so we know it's from SmartArt
    return `${diagramText.trim()}\n`;
};

/**
 * Because the relationships "Target" is relative to the slide folder,
 * we need to resolve the path to e.g. "ppt/diagrams/data1.xml".
 */
const normalizeDiagramPath = (slidePath: string, target: string): string => {
    // Example:
    //  slidePath = "ppt/slides/slide1.xml"
    //  target    = "../diagrams/data1.xml"
    // => we want "ppt/diagrams/data1.xml"
    const baseDir = slidePath.substring(0, slidePath.lastIndexOf('/')); // e.g. "ppt/slides"
    let upOne = baseDir.substring(0, baseDir.lastIndexOf('/')); // e.g. "ppt"
    let normalizedTarget = target;

    // Very basic handling for "../"
    normalizedTarget = normalizedTarget.substring(3); // remove one "../"
    upOne = upOne.substring(0, upOne.lastIndexOf('/')) || upOne;
    return `${upOne}/${normalizedTarget}`; // e.g. "ppt/diagrams/data1.xml"
};

/**
 * Find any "diagramData" relationships from the slide's .rels file
 */
const findDiagramFiles = (relsObj: any): string[] => {
    const rels = relsObj?.Relationships?.Relationship;
    if (!rels) return [];
    return rels
        .filter((rel: any) => rel.$.Type === 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagramData')
        .map((rel: any) => rel.$.Target);
};

export const extractPptxText = async (fileBuffer: Buffer): Promise<string> => {
    // 1) Load the PPTX zip
    const zip = await JSZip.loadAsync(fileBuffer);

    // 2) Find all slide XML files: ppt/slides/slide1.xml, slide2.xml, ...
    const slideFilePaths = Object.keys(zip.files).filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p));

    // 3) For each slide, parse the XML and extract text
    const slideTexts = await Promise.all(
        slideFilePaths.map(async (slidePath, index) => {
            const slideXml = await zip.file(slidePath)!.async('string');
            const slideObj = await parseStringPromise(slideXml);

            let slideText = `\n########## Slide ${index + 1} ##########\n`;
            // Extract normal text from the slide
            slideText += extractTextFromSlide(slideObj);

            // -- SMARTART / DIAGRAM PARTS --
            // Check the relationships file, e.g. "ppt/slides/_rels/slide1.xml.rels"
            const relsPath = `${slidePath.replace('slides/', 'slides/_rels/')}.rels`;
            if (zip.files[relsPath]) {
                const relsXml = await zip.file(relsPath)!.async('string');
                const relsObj = await parseStringPromise(relsXml);

                // Find any "diagramData" references
                const diagramTargets = findDiagramFiles(relsObj);
                await Promise.all(
                    diagramTargets.map(async (diagRel) => {
                        const diagAbsPath = normalizeDiagramPath(slidePath, diagRel);
                        if (zip.files[diagAbsPath]) {
                            const diagXml = await zip.file(diagAbsPath)!.async('string');
                            const diagObj = await parseStringPromise(diagXml);

                            // Extract SmartArt text
                            slideText += extractDiagramText(diagObj);
                        }
                    }),
                );
            }

            return slideText;
        }),
    );

    const extractedText = slideTexts.join('');

    return extractedText;
};
