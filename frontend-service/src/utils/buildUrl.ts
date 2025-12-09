export const buildUrl = (
    path: string,
    params: Record<string, string | number | boolean | undefined>
) => {
    const queryString = Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
        .join("&");

    return `${path}?${queryString}`;
};
