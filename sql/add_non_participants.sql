-- Add non-participants feature for children/grandparents who don't participate in drawing but have wishlists

-- Create non_participants table
CREATE TABLE IF NOT EXISTS non_participants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    managed_by_participant_id INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (managed_by_participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    INDEX idx_managed_by (managed_by_participant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modify wish_list_items table to support both participants and non-participants
-- Make participant_id nullable and add non_participant_id
ALTER TABLE wish_list_items
    MODIFY COLUMN participant_id INT NULL,
    ADD COLUMN non_participant_id INT NULL AFTER participant_id,
    ADD FOREIGN KEY (non_participant_id) REFERENCES non_participants(id) ON DELETE CASCADE,
    ADD INDEX idx_non_participant (non_participant_id);

-- Add constraint to ensure exactly one of participant_id or non_participant_id is set
ALTER TABLE wish_list_items
    ADD CONSTRAINT chk_wishlist_owner
    CHECK (
        (participant_id IS NOT NULL AND non_participant_id IS NULL) OR
        (participant_id IS NULL AND non_participant_id IS NOT NULL)
    );
