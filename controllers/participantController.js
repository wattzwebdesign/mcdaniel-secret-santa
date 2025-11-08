const db = require('../config/database');
const assignmentService = require('../services/assignmentService');

// Get current assignment
async function getAssignment(req, res) {
    try {
        const participantId = req.session.participantId;

        const result = await assignmentService.getAssignment(participantId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Get assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching your assignment'
        });
    }
}

// Draw new assignment
async function drawAssignment(req, res) {
    try {
        const participantId = req.session.participantId;

        const result = await assignmentService.drawAssignment(participantId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        // Update session if successfully picked
        if (result.success && !result.alreadyPicked) {
            req.session.hasPicked = true;
        }

        res.json(result);
    } catch (error) {
        console.error('Draw assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while drawing your Secret Santa'
        });
    }
}

// Check if can pick
async function canPick(req, res) {
    try {
        const participantId = req.session.participantId;

        const result = await assignmentService.canParticipantPick(participantId);

        res.json(result);
    } catch (error) {
        console.error('Can pick check error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while checking pick eligibility'
        });
    }
}

// Get event details
async function getEventDetails(req, res) {
    try {
        const sql = 'SELECT config_key, config_value FROM admin_config WHERE config_key IN (?, ?, ?, ?)';
        const results = await db.query(sql, ['exchange_title', 'exchange_date', 'exchange_time', 'exchange_location']);

        const settings = {};
        results.forEach(row => {
            settings[row.config_key] = row.config_value;
        });

        res.json({
            success: true,
            eventSettings: Object.keys(settings).length > 0 ? settings : null
        });
    } catch (error) {
        console.error('Get event details error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching event details'
        });
    }
}

// Generate and download calendar .ics file
async function getCalendarICS(req, res) {
    try {
        const sql = 'SELECT config_key, config_value FROM admin_config WHERE config_key IN (?, ?, ?, ?)';
        const results = await db.query(sql, ['exchange_title', 'exchange_date', 'exchange_time', 'exchange_location']);

        const settings = {};
        results.forEach(row => {
            settings[row.config_key] = row.config_value;
        });

        if (!settings.exchange_date) {
            return res.status(400).json({
                success: false,
                message: 'Event date not configured'
            });
        }

        // Format date and time for .ics file
        const eventDate = new Date(settings.exchange_date);
        const eventTime = settings.exchange_time || '18:00';
        const [hours, minutes] = eventTime.split(':');
        eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Calculate end time (2 hours after start)
        const endDate = new Date(eventDate);
        endDate.setHours(endDate.getHours() + 2);

        // Format dates to iCal format (YYYYMMDDTHHMMSS)
        const formatICalDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hour = String(date.getHours()).padStart(2, '0');
            const minute = String(date.getMinutes()).padStart(2, '0');
            const second = String(date.getSeconds()).padStart(2, '0');
            return `${year}${month}${day}T${hour}${minute}${second}`;
        };

        const startDateTime = formatICalDate(eventDate);
        const endDateTime = formatICalDate(endDate);
        const now = formatICalDate(new Date());

        // Escape special characters for .ics format
        const escapeICS = (str) => {
            if (!str) return '';
            return str.replace(/\\/g, '\\\\')
                     .replace(/;/g, '\\;')
                     .replace(/,/g, '\\,')
                     .replace(/\n/g, '\\n');
        };

        const title = escapeICS(settings.exchange_title || 'Secret Santa Gift Exchange');
        const location = escapeICS(settings.exchange_location || '');
        const description = escapeICS('Secret Santa Gift Exchange - Don\'t forget to bring your gift!');

        // Generate .ics file content
        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Secret Santa//Gift Exchange//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            `UID:secret-santa-${now}@yourdomain.com`,
            `DTSTAMP:${now}`,
            `DTSTART:${startDateTime}`,
            `DTEND:${endDateTime}`,
            `SUMMARY:${title}`,
            `DESCRIPTION:${description}`,
            location ? `LOCATION:${location}` : '',
            'STATUS:CONFIRMED',
            'SEQUENCE:0',
            'BEGIN:VALARM',
            'TRIGGER:-PT24H',
            'ACTION:DISPLAY',
            'DESCRIPTION:Reminder: Secret Santa Gift Exchange tomorrow!',
            'END:VALARM',
            'END:VEVENT',
            'END:VCALENDAR'
        ].filter(line => line !== '').join('\r\n');

        // Set headers for .ics file download
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="secret-santa.ics"');
        res.send(icsContent);
    } catch (error) {
        console.error('Generate calendar error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while generating calendar file'
        });
    }
}

module.exports = {
    getAssignment,
    drawAssignment,
    canPick,
    getEventDetails,
    getCalendarICS
};
