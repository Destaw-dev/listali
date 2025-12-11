import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();


async function dropInviteCodeIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Connected to MongoDB');
    
    // Get the groups collection
    const groupsCollection = mongoose.connection.collection('groups');
    
    // List all indexes
    const indexes = await groupsCollection.indexes();
    console.log('Current indexes:', indexes.map(idx => idx.name));
    
    // Check if inviteCode index exists
    const inviteCodeIndex = indexes.find(idx => idx.name === 'inviteCode_1');
    
    if (inviteCodeIndex) {
      console.log('Found inviteCode index, dropping it...');
      await groupsCollection.dropIndex('inviteCode_1');
      console.log('Successfully dropped inviteCode index');
    } else {
      console.log('inviteCode index not found');
    }
    
    // List indexes again to confirm
    const updatedIndexes = await groupsCollection.indexes();
    console.log('Updated indexes:', updatedIndexes.map(idx => idx.name));
    
  } catch (error) {
    console.error('Error dropping inviteCode index:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

dropInviteCodeIndex(); 