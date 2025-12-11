// Types
export * from './types';

// API
export { default as ApiClient, apiClient } from './api/client';
export * from './api/services';

// Socket
export { default as SocketClient, socketClient } from './socket/client';

// Utils
export * from './utils';

// Constants
export * from './constants';

// Re-export commonly used types for convenience
export type {
  IUser,
  IGroup,
  IShoppingList,
  IItem,
  IMessage,
  IProduct,
  IApiResponse,
  IAuthResponse,
  ISocketMessage,
  ISocketItemUpdate,
  ISocketListUpdate,
} from './types'; 