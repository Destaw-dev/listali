export declare const API_ENDPOINTS: {
    readonly AUTH: {
        readonly LOGIN: "/auth/login";
        readonly REGISTER: "/auth/register";
        readonly LOGOUT: "/auth/logout";
        readonly ME: "/auth/me";
        readonly REFRESH: "/auth/refresh";
        readonly GOOGLE: "/auth/google";
        readonly GOOGLE_CALLBACK: "/auth/google/callback";
        readonly CHECK_USERNAME: "/auth/check-username";
        readonly CHECK_EMAIL: "/auth/check-email";
    };
    readonly GROUPS: {
        readonly BASE: "/groups";
        readonly JOIN: "/groups/join";
        readonly INVITE: "/groups/invite";
        readonly LEAVE: "/groups/leave";
        readonly MEMBERS: "/groups/members";
    };
    readonly SHOPPING_LISTS: {
        readonly BASE: "/shopping-lists";
        readonly COMPLETE: "/shopping-lists/complete";
        readonly REOPEN: "/shopping-lists/reopen";
        readonly ASSIGN: "/shopping-lists/assign";
    };
    readonly ITEMS: {
        readonly BASE: "/items";
        readonly PURCHASE: "/items/purchase";
        readonly UNPURCHASE: "/items/unpurchase";
        readonly NOT_AVAILABLE: "/items/not-available";
        readonly QUANTITY: "/items/quantity";
    };
    readonly MESSAGES: {
        readonly BASE: "/messages";
        readonly READ: "/messages/read";
    };
    readonly PRODUCTS: {
        readonly BASE: "/products";
        readonly SEARCH: "/products/search";
        readonly BARCODE: "/products/barcode";
    };
    readonly CATEGORIES: {
        readonly BASE: "/categories";
        readonly SUB_CATEGORIES: "/sub-categories";
    };
};
export declare const SOCKET_EVENTS: {
    readonly CONNECT: "connect";
    readonly DISCONNECT: "disconnect";
    readonly CONNECT_ERROR: "connect_error";
    readonly USER_JOINED: "user_joined";
    readonly USER_LEFT: "user_left";
    readonly USER_STATUS_CHANGED: "user_status_changed";
    readonly JOIN_GROUP: "join_group";
    readonly LEAVE_GROUP: "leave_group";
    readonly JOIN_GROUPS: "join_groups";
    readonly SEND_MESSAGE: "send_message";
    readonly MESSAGE_RECEIVED: "message_received";
    readonly START_SHOPPING: "start_shopping";
    readonly END_SHOPPING: "end_shopping";
    readonly UPDATE_STATUS: "update_status";
    readonly UPDATE_ITEM: "update_item";
    readonly ITEM_UPDATED: "item_updated";
    readonly LIST_UPDATED: "list_updated";
    readonly ERROR: "error";
};
export declare const ITEM_STATUS: {
    readonly PENDING: "pending";
    readonly PURCHASED: "purchased";
    readonly NOT_AVAILABLE: "not_available";
    readonly CANCELLED: "cancelled";
};
export declare const LIST_STATUS: {
    readonly ACTIVE: "active";
    readonly COMPLETED: "completed";
    readonly ARCHIVED: "archived";
};
export declare const PRIORITY: {
    readonly LOW: "low";
    readonly MEDIUM: "medium";
    readonly HIGH: "high";
};
export declare const USER_ROLES: {
    readonly OWNER: "owner";
    readonly ADMIN: "admin";
    readonly MEMBER: "member";
};
export declare const MESSAGE_TYPES: {
    readonly TEXT: "text";
    readonly IMAGE: "image";
    readonly SYSTEM: "system";
    readonly ITEM_UPDATE: "item_update";
    readonly LIST_UPDATE: "list_update";
};
export declare const USER_STATUS: {
    readonly SHOPPING: "shopping";
    readonly ONLINE: "online";
    readonly AWAY: "away";
    readonly OFFLINE: "offline";
};
export declare const ITEM_CATEGORIES: {
    readonly FRUITS_VEGETABLES: "fruits_vegetables";
    readonly MEAT_FISH: "meat_fish";
    readonly DAIRY: "dairy";
    readonly BAKERY: "bakery";
    readonly PANTRY: "pantry";
    readonly FROZEN: "frozen";
    readonly BEVERAGES: "beverages";
    readonly SNACKS: "snacks";
    readonly HOUSEHOLD: "household";
    readonly PERSONAL_CARE: "personal_care";
    readonly OTHER: "other";
};
export declare const ITEM_UNITS: {
    readonly PIECE: "piece";
    readonly KG: "kg";
    readonly G: "g";
    readonly LB: "lb";
    readonly OZ: "oz";
    readonly L: "l";
    readonly ML: "ml";
    readonly CUP: "cup";
    readonly TBSP: "tbsp";
    readonly TSP: "tsp";
    readonly PACKAGE: "package";
    readonly BOX: "box";
    readonly BAG: "bag";
    readonly BOTTLE: "bottle";
    readonly CAN: "can";
};
export declare const PRODUCT_UNITS: {
    readonly UNITS: "יחידות";
    readonly KG: "ק״ג";
    readonly GRAM: "גרם";
    readonly LITER: "ליטר";
    readonly ML: "מ״ל";
    readonly PACKAGE: "אריזה";
    readonly WEIGHT: "במשקל";
    readonly BUNCH: "צרור";
    readonly DOZEN: "תריסר";
    readonly BOTTLE: "בקבוק";
    readonly CAN: "קופסה";
    readonly BOX: "קרטון";
    readonly BAG: "שקית";
};
export declare const CATEGORY_COLORS: {
    readonly fruits_vegetables: "#4CAF50";
    readonly meat_fish: "#F44336";
    readonly dairy: "#2196F3";
    readonly bakery: "#FF9800";
    readonly pantry: "#9C27B0";
    readonly frozen: "#00BCD4";
    readonly beverages: "#795548";
    readonly snacks: "#FF5722";
    readonly household: "#607D8B";
    readonly personal_care: "#E91E63";
    readonly other: "#9E9E9E";
};
export declare const CATEGORY_ICONS: {
    readonly fruits_vegetables: "🍎";
    readonly meat_fish: "🥩";
    readonly dairy: "🥛";
    readonly bakery: "🥖";
    readonly pantry: "🥫";
    readonly frozen: "🧊";
    readonly beverages: "🥤";
    readonly snacks: "🍿";
    readonly household: "🧽";
    readonly personal_care: "🧴";
    readonly other: "📦";
};
export declare const VALIDATION_RULES: {
    readonly USERNAME: {
        readonly MIN_LENGTH: 3;
        readonly MAX_LENGTH: 20;
        readonly PATTERN: RegExp;
    };
    readonly PASSWORD: {
        readonly MIN_LENGTH: 8;
        readonly PATTERN: RegExp;
    };
    readonly EMAIL: {
        readonly PATTERN: RegExp;
    };
    readonly GROUP_NAME: {
        readonly MIN_LENGTH: 2;
        readonly MAX_LENGTH: 50;
    };
    readonly LIST_NAME: {
        readonly MIN_LENGTH: 1;
        readonly MAX_LENGTH: 100;
    };
    readonly ITEM_NAME: {
        readonly MIN_LENGTH: 1;
        readonly MAX_LENGTH: 200;
    };
    readonly MESSAGE: {
        readonly MAX_LENGTH: 1000;
    };
};
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 100;
};
export declare const TIMEOUTS: {
    readonly API_REQUEST: 10000;
    readonly SOCKET_CONNECTION: 20000;
    readonly DEBOUNCE: 300;
    readonly THROTTLE: 1000;
};
export declare const STORAGE_KEYS: {
    readonly TOKEN: "token";
    readonly REFRESH_TOKEN: "refreshToken";
    readonly USER: "user";
    readonly THEME: "theme";
    readonly LANGUAGE: "language";
    readonly PREFERENCES: "preferences";
};
export declare const ERROR_MESSAGES: {
    readonly NETWORK_ERROR: "Network error. Please check your connection.";
    readonly UNAUTHORIZED: "You are not authorized to perform this action.";
    readonly FORBIDDEN: "Access denied.";
    readonly NOT_FOUND: "Resource not found.";
    readonly VALIDATION_ERROR: "Please check your input and try again.";
    readonly SERVER_ERROR: "Server error. Please try again later.";
    readonly UNKNOWN_ERROR: "An unexpected error occurred.";
};
export declare const SUCCESS_MESSAGES: {
    readonly LOGIN: "Login successful!";
    readonly REGISTER: "Registration successful!";
    readonly LOGOUT: "Logout successful!";
    readonly GROUP_CREATED: "Group created successfully!";
    readonly GROUP_UPDATED: "Group updated successfully!";
    readonly GROUP_DELETED: "Group deleted successfully!";
    readonly MEMBER_INVITED: "Member invited successfully!";
    readonly MEMBER_REMOVED: "Member removed successfully!";
    readonly LIST_CREATED: "Shopping list created successfully!";
    readonly LIST_UPDATED: "Shopping list updated successfully!";
    readonly LIST_DELETED: "Shopping list deleted successfully!";
    readonly ITEM_ADDED: "Item added successfully!";
    readonly ITEM_UPDATED: "Item updated successfully!";
    readonly ITEM_DELETED: "Item deleted successfully!";
    readonly MESSAGE_SENT: "Message sent successfully!";
};
export declare const APP_CONFIG: {
    readonly NAME: "Smart List";
    readonly VERSION: "1.0.0";
    readonly DESCRIPTION: "Smart Group Shopping App";
    readonly AUTHOR: "Destaw-dev";
    readonly SUPPORT_EMAIL: "support@smartlist.com";
};
export declare const ITEM_SOURCE: {
    readonly PRODUCT: "product";
    readonly MANUAL: "manual";
};
export declare const PRODUCT_SEARCH_OPTIONS: {
    readonly MAX_RESULTS: 10;
    readonly MIN_QUERY_LENGTH: 2;
    readonly DEBOUNCE_DELAY: 300;
};
//# sourceMappingURL=index.d.ts.map