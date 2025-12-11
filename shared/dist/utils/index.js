// Date and time utilities
export const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString();
};
export const formatDateTime = (date) => {
    const d = new Date(date);
    return d.toLocaleString();
};
export const formatRelativeTime = (date) => {
    const now = new Date();
    const target = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);
    if (diffInSeconds < 60)
        return 'Just now';
    if (diffInSeconds < 3600)
        return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
        return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(date);
};
// String utilities
export const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
export const truncate = (str, length) => {
    if (str.length <= length)
        return str;
    return str.slice(0, length) + '...';
};
export const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
};
// Validation utilities
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
export const isValidPassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};
export const isValidUsername = (username) => {
    // 3-20 characters, alphanumeric and underscore only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
};
// Array utilities
export const groupBy = (array, key) => {
    return array.reduce((groups, item) => {
        const group = key(item);
        if (!groups[group]) {
            groups[group] = [];
        }
        groups[group].push(item);
        return groups;
    }, {});
};
export const sortBy = (array, key, order = 'asc') => {
    return [...array].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        if (aVal < bVal)
            return order === 'asc' ? -1 : 1;
        if (aVal > bVal)
            return order === 'asc' ? 1 : -1;
        return 0;
    });
};
export const unique = (array) => {
    return [...new Set(array)];
};
// Number utilities
export const formatCurrency = (amount, currency = 'ILS') => {
    return new Intl.NumberFormat('he-IL', {
        style: 'currency',
        currency: currency,
    }).format(amount);
};
export const formatNumber = (num) => {
    return new Intl.NumberFormat('he-IL').format(num);
};
export const roundToDecimals = (num, decimals = 2) => {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};
// Color utilities
export const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};
export const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};
// Storage utilities (platform-agnostic)
export const storage = {
    get: (key) => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(key);
        }
        return null;
    },
    set: (key, value) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(key, value);
        }
    },
    remove: (key) => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(key);
        }
    },
    clear: () => {
        if (typeof window !== 'undefined') {
            localStorage.clear();
        }
    }
};
// Debounce utility
export const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};
// Throttle utility
export const throttle = (func, limit) => {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};
// Error handling utilities
export const handleError = (error) => {
    if (typeof error === 'string')
        return error;
    if (error?.message)
        return error.message;
    if (error?.response?.data?.message)
        return error.response.data.message;
    return 'An unexpected error occurred';
};
// URL utilities
export const getQueryParam = (param) => {
    if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }
    return null;
};
export const setQueryParam = (param, value) => {
    if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set(param, value);
        window.history.replaceState({}, '', url.toString());
    }
};
// Device detection
export const isMobile = () => {
    if (typeof window !== 'undefined') {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    return false;
};
export const isIOS = () => {
    if (typeof window !== 'undefined') {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }
    return false;
};
export const isAndroid = () => {
    if (typeof window !== 'undefined') {
        return /Android/.test(navigator.userAgent);
    }
    return false;
};
// Network utilities
export const isOnline = () => {
    if (typeof window !== 'undefined') {
        return navigator.onLine;
    }
    return true;
};
// Deep clone utility
export const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object')
        return obj;
    if (obj instanceof Date)
        return new Date(obj.getTime());
    if (obj instanceof Array)
        return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
    return obj;
};
// Product-Item utilities
export const createItemFromProduct = (product, quantity = 1, unit) => {
    return {
        name: product.name,
        description: product.brand ? `${product.brand} - ${product.name}` : product.name,
        quantity,
        unit: unit || product.defaultUnit || 'piece',
        category: product.categoryId, // Use category ID from product
        brand: product.brand,
        estimatedPrice: product.averagePrice || product.price,
        image: product.image,
        barcode: product.barcode,
        product: product._id,
        isManualEntry: false,
    };
};
export const isProductBasedItem = (item) => {
    return !item.isManualEntry && !!item.product;
};
export const getItemDisplayName = (item) => {
    if (item.brand && item.name !== item.brand) {
        return `${item.name} (${item.brand})`;
    }
    return item.name;
};
export const getItemPrice = (item) => {
    return item.actualPrice || item.estimatedPrice;
};
export const getItemTotalPrice = (item) => {
    const price = getItemPrice(item);
    return price ? price * item.quantity : 0;
};
// Item creation utilities
export const createManualItem = (itemData) => {
    return {
        ...itemData,
        isManualEntry: true,
        product: undefined,
    };
};
export const createProductBasedItem = (product, itemData) => {
    return {
        ...createItemFromProduct(product, itemData.quantity, itemData.unit),
        notes: itemData.notes,
    };
};
// Item validation
export const validateItemData = (itemData) => {
    const errors = [];
    if (!itemData.name?.trim()) {
        errors.push('Item name is required');
    }
    if (!itemData.quantity || itemData.quantity <= 0) {
        errors.push('Quantity must be greater than 0');
    }
    if (!itemData.unit) {
        errors.push('Unit is required');
    }
    if (!itemData.category) {
        errors.push('Category ID is required');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
// Product search utilities
export const searchProductsForItem = async (query, onResults, onError, categoryId) => {
    try {
        if (query.length < 2) {
            onResults([]);
            return;
        }
        // This would be implemented in the actual app using the productService
        // For now, this is a placeholder
        console.log(`Searching products for: ${query}, categoryId: ${categoryId}`);
    }
    catch (error) {
        onError('Failed to search products');
    }
};
//# sourceMappingURL=index.js.map