export { mapConfig } from './config';

export type { CoordinatesResult, UTM } from './types';
export { CoordinateSystem, Hemisphere, MapItemType } from './types';

// Export utils
export {
    convertUTMToWGS84,
    convertWGS84ToUTM,
    extractUtmLocation,
    extractUtmPoint,
    getCoordinateSystem,
    getZoneAndHemi,
    isValidUTM,
    isValidWGS84,
    locationConverterToString,
    parsePolygon,
    stringToCoordinates,
    utm,
} from './utils';
