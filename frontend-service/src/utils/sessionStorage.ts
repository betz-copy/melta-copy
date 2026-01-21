import { environment } from '../globals';

const { sessionStorage: KEYS } = environment.agGrid;

export class SessionStorage {
    private static readonly TABLE_STATE_PREFIXES = [KEYS.currentPage, KEYS.scrollPosition, KEYS.isExpand, KEYS.resizeHeight];

    public static set(key: string, value: unknown): void {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Failed to save to sessionStorage: ${key}`, error);
        }
    }

    public static get<T>(key: string): T | null {
        const item = sessionStorage.getItem(key);
        if (!item) return null;

        try {
            return JSON.parse(item) as T;
        } catch (error) {
            console.error(`Failed to parse sessionStorage item: ${key}`, error);
            return null;
        }
    }

    public static remove(key: string): void {
        sessionStorage.removeItem(key);
    }

    public static clearTableState(): void {
        for (const key of Object.keys(sessionStorage)) {
            if (SessionStorage.TABLE_STATE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
                sessionStorage.removeItem(key);
            }
        }
    }

    public static clearAll(): void {
        sessionStorage.clear();
    }
}
