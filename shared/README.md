# Smart List Shared

This folder contains shared code that can be used across both the web (Next.js) and mobile (React Native) applications.

## Structure

```
shared/
├── src/
│   ├── types/          # TypeScript interfaces and types
│   ├── api/            # API client and services
│   ├── socket/         # WebSocket client
│   ├── utils/          # Utility functions
│   ├── constants/      # App constants
│   └── index.ts        # Main export file
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── README.md          # This file
```

## Features

### Types (`src/types/`)
- Platform-agnostic TypeScript interfaces
- Shared between web and mobile
- No framework dependencies

### API (`src/api/`)
- **ApiClient**: HTTP client with authentication
- **Services**: Pre-built API service functions
- Automatic token management
- Error handling and retry logic

### Socket (`src/socket/`)
- **SocketClient**: WebSocket client for real-time features
- Event handling for live updates
- Automatic reconnection
- Platform-agnostic implementation

### Utils (`src/utils/`)
- Date/time formatting
- String manipulation
- Validation functions
- Array utilities
- Storage helpers
- Device detection

### Constants (`src/constants/`)
- API endpoints
- Socket events
- Validation rules
- Error messages
- App configuration

## Usage

### In Web App (Next.js)

```typescript
import { apiClient, groupService, socketClient } from 'shared';

// Use API services
const groups = await groupService.getGroups();

// Use socket client
socketClient.connect(userId, username, groups);
```

### In Mobile App (React Native)

```typescript
import { apiClient, groupService, socketClient } from 'shared';

// Same API as web app
const groups = await groupService.getGroups();
```

### Item Creation with Product Integration

```typescript
import { 
  itemService, 
  productService, 
  createItemFromProduct, 
  createManualItem,
  isProductBasedItem 
} from 'shared';

// Option 1: Create item from existing product
const products = await productService.searchProducts('milk');
if (products.length > 0) {
  const product = products[0];
  const itemData = createItemFromProduct(product, 2, 'l');
  const item = await itemService.addItem({
    ...itemData,
    shoppingList: 'listId'
  });
}

// Option 2: Create manual item
const manualItem = createManualItem({
  name: 'Special bread from bakery',
  quantity: 1,
  unit: 'piece',
  category: 'bakery',
  estimatedPrice: 15
});

const item = await itemService.addItem({
  ...manualItem,
  shoppingList: 'listId'
});

// Check if item is product-based
if (isProductBasedItem(item)) {
  console.log('This item is linked to a product');
} else {
  console.log('This item was manually entered');
}
```

## Installation

1. **Build the shared package:**
   ```bash
   cd shared
   npm install
   npm run build
   ```

2. **Link to your apps:**
   ```bash
   # In web app
   npm link ../shared

   # In mobile app  
   npm link ../shared
   ```

## Development

```bash
# Watch for changes
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

## Platform-Specific Adaptations

The shared code is designed to be platform-agnostic, but some features may need platform-specific implementations:

### Storage
- **Web**: Uses `localStorage`
- **Mobile**: Will use `AsyncStorage` or similar

### Navigation
- **Web**: Uses `window.location`
- **Mobile**: Will use React Navigation

### Device Features
- **Web**: Limited access to device APIs
- **Mobile**: Full access to camera, GPS, etc.

## Contributing

When adding new features to the shared code:

1. Keep it platform-agnostic
2. Add proper TypeScript types
3. Include error handling
4. Add to the main exports in `src/index.ts`
5. Update this README if needed

## Dependencies

- `axios`: HTTP client
- `socket.io-client`: WebSocket client
- `typescript`: Type checking
- `eslint`: Code linting

## License

MIT License - see LICENSE file for details. 