import { ProcessPropertyFormats } from '@microservices/shared';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv();
ajv.addFormat(ProcessPropertyFormats.FileId, /.*/);
ajv.addFormat(ProcessPropertyFormats.Signature, /.*/);
ajv.addFormat(ProcessPropertyFormats.EntityReference, /.*/);
ajv.addFormat('text-area', /.*/);
addFormats(ajv);
ajv.addVocabulary(['patternCustomErrorMessage']);

export default ajv;
