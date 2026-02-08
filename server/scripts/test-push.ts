/**
 * Script to test push notifications
 * 
 * Usage:
 *   npx tsx scripts/test-push.ts <userId>
 * 
 * Example:
 *   npx tsx scripts/test-push.ts 507f1f77bcf86cd799439011
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { sendPushNotificationToUser } from '../src/utils/pushNotifications';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testPushNotification(userId: string) {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/listali';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.error('❌ VAPID keys are not set in environment variables');
      console.error('Please set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_EMAIL in .env file');
      process.exit(1);
    }

    console.log('✅ VAPID keys are configured');

    console.log(`\n📤 Sending push notification to user: ${userId}...`);
    
    await sendPushNotificationToUser(userId, {
      title: '🧪 בדיקת התראה',
      body: 'זוהי התראה לבדיקה! אם אתה רואה את זה, הכל עובד מצוין 🎉',
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      data: {
        url: '/dashboard',
        test: true,
        timestamp: new Date().toISOString()
      },
      tag: 'test-notification',
      requireInteraction: false
    });

    console.log('✅ Push notification sent successfully!');
    console.log('\n📱 Check your device/browser for the notification');
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

const userId = process.argv[2];

if (!userId) {
  console.error('❌ Usage: npx tsx scripts/test-push.ts <userId>');
  console.error('Example: npx tsx scripts/test-push.ts 507f1f77bcf86cd799439011');
  process.exit(1);
}

if (!mongoose.Types.ObjectId.isValid(userId)) {
  console.error('❌ Invalid user ID format. Must be a valid MongoDB ObjectId');
  process.exit(1);
}

testPushNotification(userId);
