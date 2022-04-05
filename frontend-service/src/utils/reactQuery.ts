const removeItemById = <T extends { _id: string }>(id: string, data: T[] = []) => {
    return data.filter((item) => item._id !== id);
};

const replaceItemById = <T extends { _id: string }>(item: T, data: T[] = []) => {
    data.splice(
        data.findIndex((value) => value._id === item._id),
        1,
        item,
    );

    return data;
};

export { removeItemById, replaceItemById };
