const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { requireAuth, requireHasPicked } = require('../middleware/auth');
const { validateWishListItem, validateIdParam } = require('../middleware/validation');

// All wishlist routes require authentication
router.use(requireAuth);

// GET /api/wishlist/my-items - Get logged-in user's wish list
router.get('/my-items', wishlistController.getMyItems);

// POST /api/wishlist/items - Add item to wish list
router.post('/items', validateWishListItem, wishlistController.addItem);

// PUT /api/wishlist/items/:id - Update wish list item
router.put('/items/:id', validateIdParam, validateWishListItem, wishlistController.updateItem);

// DELETE /api/wishlist/items/:id - Delete wish list item
router.delete('/items/:id', validateIdParam, wishlistController.deleteItem);

// PATCH /api/wishlist/items/reorder - Reorder items
router.patch('/items/reorder', wishlistController.reorderItems);

// GET /api/wishlist/recipient-items - Get assigned person's wish list
router.get('/recipient-items', requireHasPicked, wishlistController.getRecipientItems);

// PATCH /api/wishlist/mark-purchased/:id - Mark item as purchased
router.patch('/mark-purchased/:id', requireHasPicked, validateIdParam, wishlistController.markPurchased);

// GET /api/wishlist/all-wishlists - Get all participants' wishlists (read-only view)
router.get('/all-wishlists', wishlistController.getAllWishlists);

module.exports = router;
