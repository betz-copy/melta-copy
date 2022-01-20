/* eslint-disable no-undef */
export class LocalStorage {
    public static set<T>(key: string, value: T) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    public static get<T>(key: string, defaultValue: T): T {
        const item = localStorage.getItem(key);

        return item ? JSON.parse(item) : defaultValue;
    }
}
