import { Layouts } from '../../common/GridLayout/interface';
import { environment } from '../../globals';
import { ChartsAndGenerator } from '../../interfaces/charts';

const {
    charts: { defaultColumnSizes },
} = environment;

export const generateLayoutDetails = (charts: ChartsAndGenerator[]) =>
    Object.keys(defaultColumnSizes).reduce((acc, col) => {
        // eslint-disable-next-line no-param-reassign
        acc[col] = charts.map(({ _id }, index) => ({
            i: _id,
            x: (index % 3) * 4,
            y: Math.floor(index / 3) * 3,
            w: 4,
            h: 11,
        }));
        return acc;
    }, {} as Layouts);
