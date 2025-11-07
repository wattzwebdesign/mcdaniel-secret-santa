const { body, param, validationResult } = require('express-validator');
const { parsePhoneNumber } = require('libphonenumber-js');

// Validate and return errors
function validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
}

// Custom phone number validator
const isValidPhoneNumber = (value) => {
    try {
        const phoneNumber = parsePhoneNumber(value, 'US');
        return phoneNumber && phoneNumber.isValid();
    } catch (error) {
        return false;
    }
};

// Validation rules for login
const validateLogin = [
    body('firstName')
        .trim()
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters')
        .matches(/^[a-zA-Z\s'-]+$/).withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
    body('phoneNumber')
        .trim()
        .notEmpty().withMessage('Phone number is required')
        .custom(isValidPhoneNumber).withMessage('Invalid phone number format'),
    validate
];

// Validation rules for adding participant
const validateParticipant = [
    body('firstName')
        .trim()
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters')
        .matches(/^[a-zA-Z\s'-]+$/).withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
    body('phoneNumber')
        .trim()
        .notEmpty().withMessage('Phone number is required')
        .custom(isValidPhoneNumber).withMessage('Invalid phone number format'),
    validate
];

// Validation rules for wish list item
const validateWishListItem = [
    body('itemName')
        .trim()
        .notEmpty().withMessage('Item name is required')
        .isLength({ min: 2, max: 255 }).withMessage('Item name must be 2-255 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    body('link')
        .optional()
        .trim()
        .isURL({ protocols: ['http', 'https'], require_protocol: true })
        .withMessage('Link must be a valid URL')
        .isLength({ max: 500 }).withMessage('Link must be less than 500 characters'),
    body('priceRange')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Price range must be less than 50 characters'),
    body('priority')
        .optional()
        .isInt({ min: 1, max: 3 }).withMessage('Priority must be 1, 2, or 3'),
    validate
];

// Validation rules for exclusion rule
const validateExclusionRule = [
    body('participantId')
        .isInt({ min: 1 }).withMessage('Participant ID must be a positive integer'),
    body('excludedParticipantId')
        .isInt({ min: 1 }).withMessage('Excluded participant ID must be a positive integer')
        .custom((value, { req }) => value !== req.body.participantId)
        .withMessage('A participant cannot exclude themselves'),
    body('reason')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('Reason must be less than 255 characters'),
    validate
];

// Validation rules for notification preferences
const validateNotificationPreferences = [
    body('smsEnabled')
        .optional()
        .isBoolean().withMessage('SMS enabled must be true or false'),
    body('notifyOnAssignment')
        .optional()
        .isBoolean().withMessage('Notify on assignment must be true or false'),
    body('notifyOnWishlistUpdate')
        .optional()
        .isBoolean().withMessage('Notify on wishlist update must be true or false'),
    body('notifyOnGameStart')
        .optional()
        .isBoolean().withMessage('Notify on game start must be true or false'),
    body('notifyReminders')
        .optional()
        .isBoolean().withMessage('Notify reminders must be true or false'),
    validate
];

// Validation for ID parameter
const validateIdParam = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID must be a positive integer'),
    validate
];

// Validation for admin password
const validateAdminPassword = [
    body('password')
        .notEmpty().withMessage('Password is required'),
    validate
];

// Validation for family group
const validateFamilyGroup = [
    body('participantIds')
        .isArray({ min: 2 }).withMessage('At least 2 participants required for a family group')
        .custom((value) => value.every(id => Number.isInteger(id) && id > 0))
        .withMessage('All participant IDs must be positive integers'),
    body('reason')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('Reason must be less than 255 characters'),
    validate
];

module.exports = {
    validate,
    validateLogin,
    validateParticipant,
    validateWishListItem,
    validateExclusionRule,
    validateNotificationPreferences,
    validateIdParam,
    validateAdminPassword,
    validateFamilyGroup,
    isValidPhoneNumber
};
