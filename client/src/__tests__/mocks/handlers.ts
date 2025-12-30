import { http, HttpResponse } from 'msw';
import { mockProducts, mockItems, mockGroups, mockShoppingLists, mockCategories } from './mockData';


export const handlers = [
  // Products
  http.get('/api/products', () => {
    return HttpResponse.json({
      success: true,
      data: mockProducts,
    });
  }),

  // Items
  http.get('/api/items', () => {
    return HttpResponse.json({
      success: true,
      data: mockItems,
    });
  }),

  http.post('/api/items', () => {
    return HttpResponse.json({
      success: true,
      data: mockItems[0],
    });
  }),

  // Groups
  http.get('/api/groups', () => {
    return HttpResponse.json({
      success: true,
      data: mockGroups,
    });
  }),

  // Shopping Lists
  http.get('/api/shopping-lists', () => {
    return HttpResponse.json({
      success: true,
      data: mockShoppingLists,
    });
  }),

  // Categories
  http.get('/api/categories', () => {
    return HttpResponse.json({
      success: true,
      data: mockCategories,
    });
  }),
];

