import { logger } from '@packages/utils';

const hexToARGB = (hex?: string): string => {
    if (!hex) return 'FF000000';

    const normalizedHex = hex.replace(/^#/, '');

    let r = 0;
    let g = 0;
    let b = 0;
    if (normalizedHex.length === 6) {
        r = parseInt(normalizedHex.substring(0, 2), 16);
        g = parseInt(normalizedHex.substring(2, 4), 16);
        b = parseInt(normalizedHex.substring(4, 6), 16);
    } else if (normalizedHex.length === 3) {
        r = parseInt(normalizedHex[0] + normalizedHex[0], 16);
        g = parseInt(normalizedHex[1] + normalizedHex[1], 16);
        b = parseInt(normalizedHex[2] + normalizedHex[2], 16);
    } else logger.error('Invalid hex color format');

    // eslint-disable-next-line no-bitwise
    return `FF${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
};

export default hexToARGB;
