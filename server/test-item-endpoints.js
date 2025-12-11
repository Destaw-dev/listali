// Test script for new item endpoints
// Run with: node test-item-endpoints.js

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Test data
const testData = {
  // You'll need to replace these with actual IDs from your database
  categoryId: 'your-category-id',
  productId: 'your-product-id', 
  shoppingListId: 'your-shopping-list-id',
  userId: 'your-user-id'
};

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    return null;
  }
};

// Test functions
const testCreateManualItem = async () => {
  
  const itemData = {
    name: 'Special bread from bakery',
    description: 'Fresh bread from local bakery',
    quantity: 1,
    unit: 'piece',
    category: testData.categoryId,
    brand: 'Local Bakery',
    estimatedPrice: 15,
    priority: 'medium',
    notes: 'Get the fresh one',
    alternatives: ['Regular bread', 'Whole wheat bread'],
    isManualEntry: true,
    shoppingListId: testData.shoppingListId
  };
  
  const result = await makeRequest('POST', '/items', itemData);
  if (result?.success) {
    console.log('✅ Manual item created successfully');
    console.log('Item ID:', result.data._id);
    return result.data._id;
  }
  return null;
};

const testCreateProductBasedItem = async () => {
  
  const itemData = {
    name: 'Tnuva Milk',
    description: 'Fresh milk from Tnuva',
    quantity: 2,
    unit: 'l',
    category: testData.categoryId,
    brand: 'Tnuva',
    estimatedPrice: 8.50,
    priority: 'high',
    notes: 'Get the 3% fat version',
    alternatives: ['Almond milk', 'Soy milk'],
    product: testData.productId,
    isManualEntry: false,
    shoppingListId: testData.shoppingListId
  };
  
  const result = await makeRequest('POST', '/items', itemData);
  if (result?.success) {
    console.log('✅ Product-based item created successfully');
    console.log('Item ID:', result.data._id);
    return result.data._id;
  }
  return null;
};

const testGetItems = async () => {
  
  const result = await makeRequest('GET', `/items?shoppingListId=${testData.shoppingListId}&populateProduct=true`);
  if (result?.success) {
    console.log('✅ Items retrieved successfully');
    console.log('Total items:', result.data.length);
    console.log('Items with products:', result.data.filter(item => item.product).length);
    console.log('Manual items:', result.data.filter(item => item.isManualEntry).length);
  }
};

const testGetManualItems = async () => {
  
  const result = await makeRequest('GET', `/items/manual?shoppingListId=${testData.shoppingListId}`);
  if (result?.success) {
    console.log('✅ Manual items retrieved successfully');
    console.log('Manual items count:', result.data.length);
  }
};

const testGetProductBasedItems = async () => {
  
  const result = await makeRequest('GET', `/items/product-based?shoppingListId=${testData.shoppingListId}`);
  if (result?.success) {
    console.log('✅ Product-based items retrieved successfully');
    console.log('Product-based items count:', result.data.length);
  }
};

const testGetItemsByProduct = async () => {
  
  const result = await makeRequest('GET', `/items/by-product?productId=${testData.productId}`);
  if (result?.success) {
    console.log('✅ Items by product retrieved successfully');
    console.log('Items for product count:', result.data.length);
  }
};

const testUpdateItem = async (itemId) => {
  
  const updateData = {
    quantity: 3,
    notes: 'Updated note',
    priority: 'high'
  };
  
  const result = await makeRequest('PUT', `/items/${itemId}`, updateData);
  if (result?.success) {
    console.log('✅ Item updated successfully');
    console.log('Updated quantity:', result.data.quantity);
  }
};

const testPurchaseItem = async (itemId) => {
  
  const purchaseData = {
    actualPrice: 16.50
  };
  
  const result = await makeRequest('POST', `/items/${itemId}/purchase`, purchaseData);
  if (result?.success) {
    console.log('✅ Item purchased successfully');
    console.log('Purchase status:', result.data.status);
  }
};

// Main test runner
const runTests = async () => {
  
  // Note: You'll need to set up authentication first
  // authToken = 'your-jwt-token';
  
  if (!authToken) {
    console.log('You can get a token by logging in through your app');
    return;
  }
  
  // Run tests
  const manualItemId = await testCreateManualItem();
  const productItemId = await testCreateProductBasedItem();
  
  await testGetItems();
  await testGetManualItems();
  await testGetProductBasedItems();
  await testGetItemsByProduct();
  
  if (manualItemId) {
    await testUpdateItem(manualItemId);
    await testPurchaseItem(manualItemId);
  }
  
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests }; 