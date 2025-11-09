import { Direction } from '@mui/material';
import { RJSFSchema } from '@rjsf/utils';
import BigNumber from 'bignumber.js';
import { environment } from '../globals';

const { numOfFixedDigits } = environment.entitiesProperties;

export const getFixedNumber = (value: number) => {
    const bigNumberFormatted = new BigNumber(value);
    return bigNumberFormatted.toFixed(numOfFixedDigits).replace(/\.?0+$/, '');
};

export const isStartWithHebrewLetter = (value: string) => {
    const uniqueCharsPattern = /^[^a-zA-Z\u0590-\u05FF]+/g;
    const cleanedStr = String(value).replace(uniqueCharsPattern, '');
    const isHebrewLetter = /^[\u0590-\u05FF]/.test(cleanedStr.charAt(0));

    return isHebrewLetter;
};

export const getTextDirection = (value: string, schema: RJSFSchema): Direction => {
    if (schema.type === 'string' && value) return isStartWithHebrewLetter(value) ? 'rtl' : 'ltr';

    if (schema.serialCurrent === undefined) return schema.type !== 'number' || Boolean(schema.pattern) ? 'ltr' : 'rtl';

    return 'rtl';
};

export const isStringifiedJSON = (string: string) => {
    try {
        const parsed = JSON.parse(string);
        return parsed !== null && typeof parsed === "object";
    } catch {
        return false;
    }
}
