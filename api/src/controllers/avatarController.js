import { db } from '../db/index.js';
import { avatarItems, userAvatarItems, userAvatar } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

// Category → column name mapping on userAvatar table
const CATEGORY_COLUMN = {
  hair:       'hairItemId',
  clothes:    'clothesItemId',
  pet:        'petItemId',
  background: 'backgroundItemId',
  title:      'titleItemId',
};

export const avatarController = {
  /**
   * GET /api/avatar/items
   * Returns all avatar items in the catalog, annotated with isUnlocked: true/false
   * for the currently authenticated user.
   */
  async getAvatarItems(request, reply) {
    const userIdNum = parseInt(request.user.id);

    try {
      // Fetch full catalog
      const allItems = await db
        .select()
        .from(avatarItems)
        .orderBy(avatarItems.category, avatarItems.sortOrder);

      // Fetch items this user already owns
      const owned = await db
        .select({ itemId: userAvatarItems.itemId })
        .from(userAvatarItems)
        .where(eq(userAvatarItems.userId, userIdNum));

      const ownedSet = new Set(owned.map(o => o.itemId));

      // Annotate each catalog item
      const annotated = allItems.map(item => ({
        ...item,
        isUnlocked: item.isDefault || ownedSet.has(item.id),
      }));

      return { success: true, items: annotated };
    } catch (error) {
      request.log.error('Error fetching avatar items:', error);
      reply.status(500).send({ error: 'Failed to load avatar items.' });
    }
  },

  /**
   * POST /api/avatar/equip
   * Body: { itemId: number, category: string }
   * Equips an item the user owns (or a default item). Updates userAvatar loadout.
   */
  async equipItem(request, reply) {
    const userIdNum = parseInt(request.user.id);
    const { itemId, category } = request.body || {};

    if (!itemId || !category) {
      reply.status(400).send({ error: 'itemId and category are required.' });
      return;
    }

    const columnName = CATEGORY_COLUMN[category];
    if (!columnName) {
      reply.status(400).send({ error: `Invalid category. Must be one of: ${Object.keys(CATEGORY_COLUMN).join(', ')}.` });
      return;
    }

    const itemIdNum = parseInt(itemId);

    try {
      // Verify item exists in the catalog
      const [item] = await db
        .select()
        .from(avatarItems)
        .where(eq(avatarItems.id, itemIdNum))
        .limit(1);

      if (!item) {
        reply.status(404).send({ error: 'Avatar item not found.' });
        return;
      }

      // Verify the item's category matches what was requested
      if (item.category !== category) {
        reply.status(400).send({ error: `Item category mismatch: item is "${item.category}", requested "${category}".` });
        return;
      }

      // Verify ownership: default items are always wearable; otherwise check userAvatarItems
      if (!item.isDefault) {
        const [ownership] = await db
          .select()
          .from(userAvatarItems)
          .where(and(eq(userAvatarItems.userId, userIdNum), eq(userAvatarItems.itemId, itemIdNum)))
          .limit(1);

        if (!ownership) {
          reply.status(403).send({ error: 'You have not unlocked this item.' });
          return;
        }
      }

      // Upsert the user avatar row (insert or update the relevant slot)
      const existing = await db
        .select()
        .from(userAvatar)
        .where(eq(userAvatar.userId, userIdNum))
        .limit(1);

      let updatedAvatar;

      if (existing.length === 0) {
        // First-time: create avatar row with just this slot set
        [updatedAvatar] = await db
          .insert(userAvatar)
          .values({ userId: userIdNum, [columnName]: itemIdNum, updatedAt: new Date() })
          .returning();
      } else {
        // Update the specific slot
        [updatedAvatar] = await db
          .update(userAvatar)
          .set({ [columnName]: itemIdNum, updatedAt: new Date() })
          .where(eq(userAvatar.userId, userIdNum))
          .returning();
      }

      return { success: true, message: `Equipped "${item.name}".`, avatar: updatedAvatar, equippedItem: item };
    } catch (error) {
      request.log.error('Error equipping avatar item:', error);
      reply.status(500).send({ error: 'Failed to equip avatar item.' });
    }
  },

  /**
   * GET /api/avatar/equipped
   * Returns the user's currently equipped avatar loadout with full item details
   * resolved for each slot.
   */
  async getEquippedAvatar(request, reply) {
    const userIdNum = parseInt(request.user.id);

    try {
      const [avatarRow] = await db
        .select()
        .from(userAvatar)
        .where(eq(userAvatar.userId, userIdNum))
        .limit(1);

      if (!avatarRow) {
        // User hasn't set up an avatar yet — return empty loadout
        return {
          success: true,
          avatar: null,
          loadout: { hair: null, clothes: null, pet: null, background: null, title: null },
        };
      }

      // Resolve item IDs to full item objects
      const slotColumns = {
        hair:       avatarRow.hairItemId,
        clothes:    avatarRow.clothesItemId,
        pet:        avatarRow.petItemId,
        background: avatarRow.backgroundItemId,
        title:      avatarRow.titleItemId,
      };

      const loadout = {};
      await Promise.all(
        Object.entries(slotColumns).map(async ([slot, itemId]) => {
          if (!itemId) {
            loadout[slot] = null;
            return;
          }
          const [item] = await db
            .select()
            .from(avatarItems)
            .where(eq(avatarItems.id, itemId))
            .limit(1);
          loadout[slot] = item ?? null;
        })
      );

      return { success: true, avatar: avatarRow, loadout };
    } catch (error) {
      request.log.error('Error fetching equipped avatar:', error);
      reply.status(500).send({ error: 'Failed to load equipped avatar.' });
    }
  },
};
