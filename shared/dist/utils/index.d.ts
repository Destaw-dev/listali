export declare const formatDate: (date: Date | string) => string;
export declare const formatDateTime: (date: Date | string) => string;
export declare const formatRelativeTime: (date: Date | string) => string;
export declare const capitalize: (str: string) => string;
export declare const truncate: (str: string, length: number) => string;
export declare const generateId: () => string;
export declare const isValidEmail: (email: string) => boolean;
export declare const isValidPassword: (password: string) => boolean;
export declare const isValidUsername: (username: string) => boolean;
export declare const groupBy: <T, K extends string>(array: T[], key: (item: T) => K) => Record<K, T[]>;
export declare const sortBy: <T>(array: T[], key: keyof T, order?: "asc" | "desc") => T[];
export declare const unique: <T>(array: T[]) => T[];
export declare const formatCurrency: (amount: number, currency?: string) => string;
export declare const formatNumber: (num: number) => string;
export declare const roundToDecimals: (num: number, decimals?: number) => number;
export declare const hexToRgb: (hex: string) => {
    r: number;
    g: number;
    b: number;
} | null;
export declare const rgbToHex: (r: number, g: number, b: number) => string;
export declare const storage: {
    get: (key: string) => string | null;
    set: (key: string, value: string) => void;
    remove: (key: string) => void;
    clear: () => void;
};
export declare const debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => ((...args: Parameters<T>) => void);
export declare const throttle: <T extends (...args: any[]) => any>(func: T, limit: number) => ((...args: Parameters<T>) => void);
export declare const handleError: (error: any) => string;
export declare const getQueryParam: (param: string) => string | null;
export declare const setQueryParam: (param: string, value: string) => void;
export declare const isMobile: () => boolean;
export declare const isIOS: () => boolean;
export declare const isAndroid: () => boolean;
export declare const isOnline: () => boolean;
import { IProduct, IItem } from '../types';
export declare const deepClone: <T>(obj: T) => T;
export declare const createItemFromProduct: (product: IProduct, quantity?: number, unit?: string) => Partial<IItem>;
export declare const isProductBasedItem: (item: IItem) => boolean;
export declare const getItemDisplayName: (item: IItem) => string;
export declare const getItemPrice: (item: IItem) => number | undefined;
export declare const getItemTotalPrice: (item: IItem) => number;
export declare const createManualItem: (itemData: {
    name: string;
    quantity: number;
    unit: string;
    category: string;
    brand?: string;
    estimatedPrice?: number;
    description?: string;
    notes?: string;
}) => Partial<IItem>;
export declare const createProductBasedItem: (product: IProduct, itemData: {
    quantity: number;
    unit?: string;
    notes?: string;
}) => Partial<IItem>;
export declare const validateItemData: (itemData: Partial<IItem>) => {
    isValid: boolean;
    errors: string[];
};
export declare const searchProductsForItem: (query: string, onResults: (products: IProduct[]) => void, onError: (error: string) => void, categoryId?: string) => Promise<void>;
//# sourceMappingURL=index.d.ts.map