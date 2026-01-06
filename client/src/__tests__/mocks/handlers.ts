import { http, HttpResponse } from 'msw';
import { mockProducts, mockItems, mockGroups, mockShoppingLists, mockCategories } from './mockData';


export const handlers = [
  http.get('/api/products', () => {
    return HttpResponse.json({
      success: true,
      data: mockProducts,
    });
  }),

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

  http.get('/api/groups', () => {
    return HttpResponse.json({
      success: true,
      data: mockGroups,
    });
  }),

  http.get('/api/shopping-lists', () => {
    return HttpResponse.json({
      success: true,
      data: mockShoppingLists,
    });
  }),

  http.get('/api/categories', () => {
    return HttpResponse.json({
      success: true,
      data: mockCategories,
    });
  }),
];

