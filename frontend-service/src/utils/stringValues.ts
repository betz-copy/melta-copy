import BigNumber from 'bignumber.js';
import { Direction } from '@mui/material';
import { RJSFSchema } from '@rjsf/utils';

export const getFixedNumber = (value: number) => {
    const b = new BigNumber(value);
    return b.toFixed(18).replace(/\.?0+$/, '');
};

export const isStartWithHebrewLetter = (value: string) => {
    const uniqueCharsPattern = /^[^a-zA-Z\u0590-\u05FF]+/g;
    const cleanedStr = value.replace(uniqueCharsPattern, '');
    const isHebrewLetter = /^[\u0590-\u05FF]/.test(cleanedStr.charAt(0));

    return isHebrewLetter;
};

export const getTextDirection = (value: string, schema: RJSFSchema): Direction => {
    if (schema.type === 'string' && value) {
        return isStartWithHebrewLetter(value) ? 'rtl' : 'ltr';
    }

    if (schema.serialCurrent === undefined) {
        return schema.type === 'number' || Boolean(schema.pattern) ? 'ltr' : 'rtl';
    }
    return 'ltr';
};
