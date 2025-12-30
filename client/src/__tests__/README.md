# Tests Directory

כל הטסטים של הקליינט נמצאים בתיקייה זו.

## מבנה התיקיות

```
src/__tests__/
├── components/        # טסטים לקומפוננטות
│   ├── Button.test.tsx
│   ├── Input.test.tsx
│   ├── Badge.test.tsx
│   ├── Card.test.tsx
│   └── LoadingSpinner.test.tsx
├── hooks/              # טסטים ל-hooks
│   └── useDebounce.test.ts
├── lib/                # טסטים לפונקציות עזר
│   └── utils.test.ts
└── mocks/              # Mock data
    ├── mockData.ts     # נתונים מדומים
    └── handlers.ts     # Mock API handlers
```

## Mock Data

כל ה-mock data נמצא ב-`mocks/mockData.ts`:
- `mockUser`, `mockUsers` - משתמשים
- `mockProduct`, `mockProducts` - מוצרים
- `mockItem`, `mockItems` - פריטים
- `mockGroup`, `mockGroups` - קבוצות
- `mockShoppingList`, `mockShoppingLists` - רשימות קניות
- `mockCategory`, `mockCategories` - קטגוריות
- `mockChatMessage`, `mockChatMessages` - הודעות צ'אט

## הרצת טסטים

```bash
# הרצת כל הטסטים
npm test

# הרצת טסטים פעם אחת
npm run test:run

# הרצת טסטים עם UI
npm run test:ui

# הרצת טסטים עם כיסוי
npm run test:coverage
```

## כתיבת טסטים חדשים

### טסט לקומפוננטה

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### טסט ל-hook

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMyHook } from '@/hooks/useMyHook';

describe('useMyHook', () => {
  it('should return initial value', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current).toBeDefined();
  });
});
```

### שימוש ב-Mock Data

```typescript
import { mockUser, mockItems } from '@/__tests__/mocks/mockData';

it('should display user name', () => {
  render(<UserProfile user={mockUser} />);
  expect(screen.getByText(mockUser.firstName)).toBeInTheDocument();
});
```

## Best Practices

1. **שם תיאורי** - השתמש בשמות ברורים שמסבירים מה הטסט בודק
2. **טסט אחד = בדיקה אחת** - כל טסט צריך לבדוק דבר אחד
3. **שימוש ב-Mock Data** - השתמש ב-mock data מהתיקייה `mocks/`
4. **נקיון** - נקה state בין טסטים
5. **Testing Library** - השתמש ב-queries סמנטיים (`getByRole`, `getByLabelText`)

## סטטיסטיקות

כרגע יש:
- **98 טסטים** שעוברים בהצלחה
- **7 קבצי טסטים**
- כיסוי של:
  - קומפוננטות: Button, Input, Badge, Card, LoadingSpinner
  - Hooks: useDebounce
  - Utilities: utils functions

