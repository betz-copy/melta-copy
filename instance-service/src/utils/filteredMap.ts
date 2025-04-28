const filteredMap = <T, V>(arr: T[], func: (value: T) => { include: true; value: V } | { include: false; value?: any } | undefined) => {
    const newArr: V[] = [];

    for (let i = 0; i < arr.length; i++) {
        const returnValue = func(arr[i]) ?? { include: false };

        if (returnValue.include) {
            newArr.push(returnValue.value);
        }
    }

    return newArr;
};

export default filteredMap;
