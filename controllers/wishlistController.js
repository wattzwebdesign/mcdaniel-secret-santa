const db = require('../config/database');
const notificationService = require('../services/notificationService');

// Get my wish list items
async function getMyItems(req, res) {
    try {
        const participantId = req.session.participantId;

        // Get participant's own items
        const myItemsSql = `
            SELECT
                id,
                participant_id,
                non_participant_id,
                item_name,
                description,
                link,
                price_range,
                priority,
                display_order,
                created_at,
                updated_at
            FROM wish_list_items
            WHERE participant_id = ?
            ORDER BY display_order ASC, priority ASC, created_at ASC
        `;

        const myItems = await db.query(myItemsSql, [participantId]);

        // Get non-participants managed by this participant
        const nonParticipantsSql = `
            SELECT id, name, notes
            FROM non_participants
            WHERE managed_by_participant_id = ?
            ORDER BY name ASC
        `;

        const nonParticipants = await db.query(nonParticipantsSql, [participantId]);

        // Get items for each non-participant
        const nonParticipantItems = [];
        for (const np of nonParticipants) {
            const npItemsSql = `
                SELECT
                    id,
                    participant_id,
                    non_participant_id,
                    item_name,
                    description,
                    link,
                    price_range,
                    priority,
                    display_order,
                    created_at,
                    updated_at
                FROM wish_list_items
                WHERE non_participant_id = ?
                ORDER BY display_order ASC, priority ASC, created_at ASC
            `;

            const items = await db.query(npItemsSql, [np.id]);
            nonParticipantItems.push({
                nonParticipant: np,
                items
            });
        }

        res.json({
            success: true,
            items: myItems,
            nonParticipants: nonParticipantItems
        });
    } catch (error) {
        console.error('Get my items error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching your wish list'
        });
    }
}

// Add wish list item
async function addItem(req, res) {
    try {
        const participantId = req.session.participantId;
        const { itemName, description, link, priceRange, priority, nonParticipantId } = req.body;

        // If adding for a non-participant, verify the user manages them
        if (nonParticipantId) {
            const checkSql = 'SELECT id FROM non_participants WHERE id = ? AND managed_by_participant_id = ?';
            const [npCheck] = await db.query(checkSql, [nonParticipantId, participantId]);

            if (!npCheck) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not manage this non-participant'
                });
            }
        }

        const sql = `
            INSERT INTO wish_list_items
            (participant_id, non_participant_id, item_name, description, link, price_range, priority)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await db.query(sql, [
            nonParticipantId ? null : participantId,
            nonParticipantId || null,
            itemName,
            description || null,
            link || null,
            priceRange || null,
            priority || 2
        ]);

        // Notify Santa asynchronously (only for participant's own wishlist)
        if (!nonParticipantId) {
            notificationService.notifyWishListUpdate(participantId)
                .catch(err => console.error('Error notifying Santa:', err));
        }

        res.json({
            success: true,
            itemId: result.insertId,
            message: 'Item added successfully'
        });
    } catch (error) {
        console.error('Add item error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while adding the item'
        });
    }
}

// Update wish list item
async function updateItem(req, res) {
    try {
        const participantId = req.session.participantId;
        const itemId = parseInt(req.params.id);
        const { itemName, description, link, priceRange, priority } = req.body;

        // Check ownership - allow if it's participant's own item OR if they manage the non-participant
        const checkSql = `
            SELECT
                w.participant_id,
                w.non_participant_id,
                np.managed_by_participant_id
            FROM wish_list_items w
            LEFT JOIN non_participants np ON w.non_participant_id = np.id
            WHERE w.id = ?
        `;
        const [item] = await db.query(checkSql, [itemId]);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        // Check if user owns this item (either directly or manages the non-participant)
        const isOwner = item.participant_id === participantId;
        const managesNonParticipant = item.non_participant_id && item.managed_by_participant_id === participantId;

        if (!isOwner && !managesNonParticipant) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own wish list items'
            });
        }

        const sql = `
            UPDATE wish_list_items
            SET item_name = ?,
                description = ?,
                link = ?,
                price_range = ?,
                priority = ?
            WHERE id = ?
        `;

        await db.query(sql, [
            itemName,
            description || null,
            link || null,
            priceRange || null,
            priority || 2,
            itemId
        ]);

        // Notify Santa asynchronously (only for participant's own items)
        if (isOwner) {
            notificationService.notifyWishListUpdate(participantId)
                .catch(err => console.error('Error notifying Santa:', err));
        }

        res.json({
            success: true,
            message: 'Item updated successfully'
        });
    } catch (error) {
        console.error('Update item error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating the item'
        });
    }
}

// Delete wish list item
async function deleteItem(req, res) {
    try {
        const participantId = req.session.participantId;
        const itemId = parseInt(req.params.id);

        // Check ownership - allow if it's participant's own item OR if they manage the non-participant
        const checkSql = `
            SELECT
                w.participant_id,
                w.non_participant_id,
                np.managed_by_participant_id
            FROM wish_list_items w
            LEFT JOIN non_participants np ON w.non_participant_id = np.id
            WHERE w.id = ?
        `;
        const [item] = await db.query(checkSql, [itemId]);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        // Check if user owns this item (either directly or manages the non-participant)
        const isOwner = item.participant_id === participantId;
        const managesNonParticipant = item.non_participant_id && item.managed_by_participant_id === participantId;

        if (!isOwner && !managesNonParticipant) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own wish list items'
            });
        }

        const sql = `DELETE FROM wish_list_items WHERE id = ?`;
        await db.query(sql, [itemId]);

        res.json({
            success: true,
            message: 'Item deleted successfully'
        });
    } catch (error) {
        console.error('Delete item error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while deleting the item'
        });
    }
}

// Reorder wish list items
async function reorderItems(req, res) {
    try {
        const participantId = req.session.participantId;
        const { itemIds } = req.body; // Array of item IDs in new order

        if (!Array.isArray(itemIds) || itemIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid item order'
            });
        }

        // Update display order for each item
        for (let i = 0; i < itemIds.length; i++) {
            await db.query(
                `UPDATE wish_list_items
                 SET display_order = ?
                 WHERE id = ? AND participant_id = ?`,
                [i, itemIds[i], participantId]
            );
        }

        res.json({
            success: true,
            message: 'Items reordered successfully'
        });
    } catch (error) {
        console.error('Reorder items error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while reordering items'
        });
    }
}

// Get recipient's wish list (for Santa)
async function getRecipientItems(req, res) {
    try {
        const participantId = req.session.participantId;

        // Get assigned recipient
        const assignSql = `
            SELECT assigned_to_id
            FROM participants
            WHERE id = ? AND has_picked = TRUE
        `;

        const [participant] = await db.query(assignSql, [participantId]);

        if (!participant || !participant.assigned_to_id) {
            return res.status(403).json({
                success: false,
                message: 'You must draw your Secret Santa first'
            });
        }

        const recipientId = participant.assigned_to_id;

        // Get recipient's wish list
        const sql = `
            SELECT
                w.id,
                w.item_name,
                w.description,
                w.link,
                w.price_range,
                w.priority,
                w.display_order,
                CASE WHEN wp.id IS NOT NULL THEN TRUE ELSE FALSE END as is_purchased
            FROM wish_list_items w
            LEFT JOIN wish_list_purchases wp ON w.id = wp.wish_list_item_id
                AND wp.santa_participant_id = ?
            WHERE w.participant_id = ?
            ORDER BY w.display_order ASC, w.priority ASC, w.created_at ASC
        `;

        const items = await db.query(sql, [participantId, recipientId]);

        res.json({
            success: true,
            items
        });
    } catch (error) {
        console.error('Get recipient items error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the wish list'
        });
    }
}

// Mark item as purchased
async function markPurchased(req, res) {
    try {
        const participantId = req.session.participantId;
        const itemId = parseInt(req.params.id);

        // Verify the item belongs to their assigned recipient
        const verifySql = `
            SELECT w.participant_id
            FROM wish_list_items w
            JOIN participants p ON p.assigned_to_id = w.participant_id
            WHERE w.id = ? AND p.id = ? AND p.has_picked = TRUE
        `;

        const [verification] = await db.query(verifySql, [itemId, participantId]);

        if (!verification) {
            return res.status(403).json({
                success: false,
                message: 'You can only mark items from your recipient\'s wish list'
            });
        }

        // Check if already marked
        const checkSql = `
            SELECT id FROM wish_list_purchases
            WHERE wish_list_item_id = ? AND santa_participant_id = ?
        `;

        const [existing] = await db.query(checkSql, [itemId, participantId]);

        if (existing) {
            // Unmark (toggle)
            await db.query(
                `DELETE FROM wish_list_purchases WHERE id = ?`,
                [existing.id]
            );

            return res.json({
                success: true,
                isPurchased: false,
                message: 'Item unmarked as purchased'
            });
        } else {
            // Mark as purchased
            await db.query(
                `INSERT INTO wish_list_purchases
                 (wish_list_item_id, santa_participant_id)
                 VALUES (?, ?)`,
                [itemId, participantId]
            );

            return res.json({
                success: true,
                isPurchased: true,
                message: 'Item marked as purchased'
            });
        }
    } catch (error) {
        console.error('Mark purchased error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while marking the item'
        });
    }
}

// Get all wishlists (for all-wishlists page - read-only view)
async function getAllWishlists(req, res) {
    try {
        // Get all participants
        const participantsSql = `
            SELECT id, first_name
            FROM participants
            ORDER BY first_name ASC
        `;
        const participants = await db.query(participantsSql);

        // Get all non-participants
        const nonParticipantsSql = `
            SELECT
                np.id,
                np.name,
                np.managed_by_participant_id,
                p.first_name as managed_by_name
            FROM non_participants np
            JOIN participants p ON np.managed_by_participant_id = p.id
            ORDER BY np.name ASC
        `;
        const nonParticipants = await db.query(nonParticipantsSql);

        // Get all wish list items for both participants and non-participants
        const itemsSql = `
            SELECT
                id,
                participant_id,
                non_participant_id,
                item_name,
                description,
                link,
                price_range,
                priority,
                display_order
            FROM wish_list_items
            ORDER BY display_order ASC, priority ASC, created_at ASC
        `;
        const items = await db.query(itemsSql);

        // Group items by participant
        const participantWishlists = participants.map(participant => {
            const participantItems = items.filter(item => item.participant_id === participant.id);

            return {
                id: participant.id,
                name: participant.first_name,
                type: 'participant',
                items: participantItems
            };
        });

        // Group items by non-participant
        const nonParticipantWishlists = nonParticipants.map(nonParticipant => {
            const npItems = items.filter(item => item.non_participant_id === nonParticipant.id);

            return {
                id: nonParticipant.id,
                name: nonParticipant.name,
                type: 'non-participant',
                managed_by_name: nonParticipant.managed_by_name,
                items: npItems
            };
        });

        // Combine both lists
        const wishlists = [...participantWishlists, ...nonParticipantWishlists];

        res.json({
            success: true,
            wishlists
        });
    } catch (error) {
        console.error('Get all wishlists error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching wishlists'
        });
    }
}

module.exports = {
    getMyItems,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    getRecipientItems,
    markPurchased,
    getAllWishlists
};
