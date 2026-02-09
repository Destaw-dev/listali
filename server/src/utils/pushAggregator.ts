import { sendLocalizedPushToUser, PushVars } from './pushNotifications';

/**
 * Configuration for push aggregation
 */
const AGGREGATION_CONFIG = {
  MIN_DELAY_MS: 3000,
  MAX_DELAY_MS: 8000,
  MAX_WINDOW_MS: 15000,
  EXTEND_THRESHOLD_MS: 2000
};

/**
 */
interface AggregationKey {
  targetUserId: string;
  listId: string;
  groupId: string;
  type: 'itemPurchased' | 'itemUnpurchased' | 'itemsPurchased' | 'itemsUnpurchased';
}

/**
 */
interface AggregatedPush {
  key: AggregationKey;
  actorName: string;
  listName: string;
  itemCount: number;
  itemNames: string[];
  firstTimestamp: number;
  lastTimestamp: number;
  timer: NodeJS.Timeout | null;
  flushScheduled: boolean;
}

/**
 * In-memory buffer for aggregated pushes
 * Key format: `${targetUserId}:${listId}:${groupId}:${type}`
 */
const aggregationBuffer = new Map<string, AggregatedPush>();

/**
 * Generate aggregation key string
 */
function getAggregationKeyString(key: AggregationKey): string {
  return `${key.targetUserId}:${key.listId}:${key.groupId}:${key.type}`;
}

/**
 * Flush aggregated push notification
 */
async function flushAggregatedPush(keyString: string, aggregated: AggregatedPush): Promise<void> {
  try {
    const { key, actorName, listName, itemCount, itemNames } = aggregated;
    
    let pushKey: 'itemPurchased' | 'itemsPurchased' | 'itemUnpurchased' | 'itemsUnpurchased';
    if (key.type === 'itemPurchased' || key.type === 'itemsPurchased') {
      pushKey = itemCount === 1 ? 'itemPurchased' : 'itemsPurchased';
    } else {
      pushKey = itemCount === 1 ? 'itemUnpurchased' : 'itemsUnpurchased';
    }

    const tag = `list:${key.listId}`;

    const ShoppingList = (await import('../models/shoppingList')).default;
    const list = await ShoppingList.findById(key.listId).select('name');
    const finalListName = list?.name || listName;

    const vars: PushVars = {
      username: actorName,
      count: itemCount,
      listName: finalListName,
      ...(itemNames.length === 1 && { itemName: itemNames[0] })
    };

    await sendLocalizedPushToUser(key.targetUserId, {
      key: pushKey,
      vars: vars,
      url: `/groups/${key.groupId}/${key.listId}`,
      tag: tag,
      renotify: true,
      data: {
        listId: key.listId,
        groupId: key.groupId
      }
    });

    aggregationBuffer.delete(keyString);
  } catch (error) {
    console.error(`Error flushing aggregated push for ${keyString}:`, error);
    aggregationBuffer.delete(keyString);
  }
}

/**
 * Schedule flush for aggregated push
 */
function scheduleFlush(keyString: string, aggregated: AggregatedPush, delay: number): void {
  if (aggregated.timer) {
    clearTimeout(aggregated.timer);
  }

  aggregated.flushScheduled = true;
  aggregated.timer = setTimeout(() => {
    flushAggregatedPush(keyString, aggregated).catch(error => {
      console.error(`Error in scheduled flush for ${keyString}:`, error);
    });
  }, delay);
}

/**
 * Queue a list update push notification with aggregation
 * 
 * @param params - Push notification parameters
 */
export async function queueListUpdatePush(params: {
  targetUserId: string;
  actorName: string;
  listId: string;
  listName: string;
  groupId: string;
  type: 'itemPurchased' | 'itemUnpurchased' | 'itemsPurchased' | 'itemsUnpurchased';
  itemName?: string;
  itemQuantity?: number;
}): Promise<void> {
  const { targetUserId, actorName, listId, listName, groupId, type, itemName, itemQuantity = 1 } = params;

  const aggregationKey: AggregationKey = {
    targetUserId,
    listId,
    groupId,
    type
  };

  const keyString = getAggregationKeyString(aggregationKey);
  const now = Date.now();

  const existing = aggregationBuffer.get(keyString);

  if (existing) {
    existing.itemCount += itemQuantity;
    existing.lastTimestamp = now;
    
    if (itemName && !existing.itemNames.includes(itemName)) {
      existing.itemNames.push(itemName);
      if (existing.itemNames.length > 3) {
        existing.itemNames.shift();
      }
    }

    const timeSinceFirst = now - existing.firstTimestamp;

    if (timeSinceFirst >= AGGREGATION_CONFIG.MAX_WINDOW_MS) {
      if (existing.timer) {
        clearTimeout(existing.timer);
      }
      await flushAggregatedPush(keyString, existing);
      return;
    }

    const remainingTime = AGGREGATION_CONFIG.MAX_WINDOW_MS - timeSinceFirst;
    
    const timeUntilFlush = existing.timer 
      ? Math.max(0, AGGREGATION_CONFIG.MIN_DELAY_MS - (now - existing.lastTimestamp))
      : AGGREGATION_CONFIG.MIN_DELAY_MS;

    if (timeUntilFlush <= AGGREGATION_CONFIG.EXTEND_THRESHOLD_MS && remainingTime > AGGREGATION_CONFIG.EXTEND_THRESHOLD_MS) {
      const newDelay = Math.min(remainingTime, AGGREGATION_CONFIG.MAX_DELAY_MS);
      scheduleFlush(keyString, existing, newDelay);
    }
  } else {
    const aggregated: AggregatedPush = {
      key: aggregationKey,
      actorName,
      listName,
      itemCount: itemQuantity,
      itemNames: itemName ? [itemName] : [],
      firstTimestamp: now,
      lastTimestamp: now,
      timer: null,
      flushScheduled: false
    };

    aggregationBuffer.set(keyString, aggregated);

    scheduleFlush(keyString, aggregated, AGGREGATION_CONFIG.MIN_DELAY_MS);
  }
}

/**
 * Force flush all pending aggregations (useful for testing or shutdown)
 */
export async function flushAllAggregations(): Promise<void> {
  const promises = Array.from(aggregationBuffer.entries()).map(([keyString, aggregated]) => {
    if (aggregated.timer) {
      clearTimeout(aggregated.timer);
    }
    return flushAggregatedPush(keyString, aggregated);
  });

  await Promise.allSettled(promises);
}

/**
 * Clear aggregation buffer (useful for testing)
 */
export function clearAggregationBuffer(): void {
  for (const aggregated of aggregationBuffer.values()) {
    if (aggregated.timer) {
      clearTimeout(aggregated.timer);
    }
  }
  aggregationBuffer.clear();
}

/**
 * Get current buffer size (useful for monitoring)
 */
export function getBufferSize(): number {
  return aggregationBuffer.size;
}
