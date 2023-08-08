import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv();
ajv.addFormat('fileId', /.*/);
ajv.addFormat('entityReference', /.*/);
addFormats(ajv);
ajv.addVocabulary(['patternCustomErrorMessage']);

export default ajv;
