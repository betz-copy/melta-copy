import { IPropertyValue } from '@packages/entity';

export class LocalStorage {
    public static set(key: string, value: IPropertyValue) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    public static get<T>(key: string): T | null {
        const item = localStorage.getItem(key);

        return item ? JSON.parse(item) : null;
    }

    public static remove(key: string) {
        localStorage.removeItem(key);
    }
}
