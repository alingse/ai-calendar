import { Router } from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

interface Event {
  id?: number;
  title: string;
  type: 'one-time' | 'recurring';
  date?: string;
  day_of_week?: number;
  start_time: string;
  end_time: string;
}

// Get all events
router.get('/', authenticateToken, (req, res) => {
  try {
    const events = db.prepare('SELECT * FROM events ORDER BY created_at DESC').all();
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Create event
router.post('/', authenticateToken, (req, res) => {
  try {
    const { title, type, date, day_of_week, start_time, end_time } = req.body as Event;

    // Validation
    if (!title || !type || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (type === 'one-time' && !date) {
      return res.status(400).json({ error: 'Date is required for one-time events' });
    }

    if (type === 'recurring' && day_of_week === undefined) {
      return res.status(400).json({ error: 'Day of week is required for recurring events' });
    }

    const stmt = db.prepare(`
      INSERT INTO events (title, type, date, day_of_week, start_time, end_time)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(title, type, date || null, day_of_week ?? null, start_time, end_time);

    res.status(201).json({ id: result.lastInsertRowid, message: 'Event created successfully' });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, date, day_of_week, start_time, end_time } = req.body as Event;

    const stmt = db.prepare(`
      UPDATE events
      SET title = ?, type = ?, date = ?, day_of_week = ?, start_time = ?, end_time = ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    const result = stmt.run(title, type, date || null, day_of_week ?? null, start_time, end_time, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare('DELETE FROM events WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
