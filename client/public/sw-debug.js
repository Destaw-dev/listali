// Debug script to check Service Worker status
// Run this in browser console

console.log('🔍 Service Worker Debug Info');
console.log('============================');

// Check if Service Worker is supported
if ('serviceWorker' in navigator) {
  console.log('✅ Service Worker API is supported');
  
  // Check current registrations
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log(`📋 Found ${registrations.length} registration(s):`);
    registrations.forEach((reg, index) => {
      console.log(`\nRegistration ${index + 1}:`);
      console.log('  Scope:', reg.scope);
      console.log('  Active:', reg.active ? 'Yes' : 'No');
      console.log('  Installing:', reg.installing ? 'Yes' : 'No');
      console.log('  Waiting:', reg.waiting ? 'Yes' : 'No');
      console.log('  Update URL:', reg.update);
    });
  });
  
  // Check if controller exists
  if (navigator.serviceWorker.controller) {
    console.log('\n✅ Service Worker is controlling this page');
    console.log('Controller script URL:', navigator.serviceWorker.controller.scriptURL);
    console.log('Controller state:', navigator.serviceWorker.controller.state);
  } else {
    console.log('\n⚠️ No Service Worker is controlling this page');
  }
  
  // Try to register
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('\n✅ Service Worker registration successful!');
      console.log('Scope:', registration.scope);
      console.log('Update URL:', registration.update);
    })
    .catch(error => {
      console.error('\n❌ Service Worker registration failed:');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
    });
  
} else {
  console.error('❌ Service Worker API is NOT supported in this browser');
}

// Check HTTPS/localhost
const isSecure = window.location.protocol === 'https:' || 
                 window.location.hostname === 'localhost' ||
                 window.location.hostname === '127.0.0.1';
console.log('\n🔒 Secure context:', isSecure ? 'Yes ✅' : 'No ❌');
console.log('Protocol:', window.location.protocol);
console.log('Hostname:', window.location.hostname);

// Check if sw.js is accessible
fetch('/sw.js')
  .then(response => {
    if (response.ok) {
      console.log('\n✅ sw.js file is accessible');
      console.log('Status:', response.status);
      console.log('Content-Type:', response.headers.get('Content-Type'));
    } else {
      console.error('\n❌ sw.js file is NOT accessible');
      console.error('Status:', response.status);
    }
  })
  .catch(error => {
    console.error('\n❌ Error fetching sw.js:', error.message);
  });
