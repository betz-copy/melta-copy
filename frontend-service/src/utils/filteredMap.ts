import { IPropertyValue } from '../interfaces/entities';

export const filteredMap = <T, V>(
    arr: T[],
    func: (value: T, index: number) => { include: true; value: V } | { include: false; value?: IPropertyValue } | undefined,
) => {
    const newArr: V[] = [];

    for (let i = 0; i < arr.length; i++) {
        const returnValue = func(arr[i], i);

        if (returnValue?.include) {
            newArr.push(returnValue.value);
        }
    }

    return newArr;
};
