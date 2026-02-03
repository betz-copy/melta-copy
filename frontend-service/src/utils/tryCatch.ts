export const tryCatch = async <Func extends (...args: unknown[]) => unknown>(func: Func, ...args: Parameters<Func>) => {
    try {
        return { result: (await func(...args)) as Awaited<ReturnType<Func>> };
    } catch (err) {
        return { err };
    }
};
