import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { ProcessPropertyFormats } from '@microservices/shared/src/interfaces/process/templates/process';

const ajv = new Ajv();
ajv.addFormat(ProcessPropertyFormats.FileId, /.*/);
ajv.addFormat(ProcessPropertyFormats.EntityReference, /.*/);
ajv.addFormat('text-area', /.*/);
addFormats(ajv);
ajv.addVocabulary(['patternCustomErrorMessage']);

export default ajv;
