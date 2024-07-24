import { patchDocument, PatchType, TextRun } from 'docx';
import { Readable, Transform } from 'stream';
import { IEntity } from '../../../externalServices/instanceService/interfaces/entities';

const createPatchesFromEntity = (entity: IEntity) => {
    const boldTagRegex = /<(b|strong)>(.*?)<\/\1>/g;

    const patches: any = {};

    Object.keys(entity.properties).forEach((property) => {
        let isBold = false;

        if (typeof entity.properties[property] === 'string') {
            if (boldTagRegex.test(entity[property])) {
                isBold = true;
            }

            entity.properties[property] = entity.properties[property].replace(boldTagRegex, '$2');
        }

        patches[property] = {
            type: PatchType.PARAGRAPH,
            children: [new TextRun(entity.properties[property])],
            bold: isBold,
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
            } catch (error) {
                console.error('Error patching document:', error);
                callback(error as Error);
            }
        },
    });

    fileStream.pipe(transformStream);

    return transformStream;
};

// (async () => {
//     const entityId = 'your-entity-id'; // Replace with your actual entity ID
//     const patchedStream = await patchDocumentAsStream(entityId);
//     patchedStream.pipe(fs.createWriteStream('My Document.docx'));
//     console.log('Document patched successfully and streamed.');
// })();
