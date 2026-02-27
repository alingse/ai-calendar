import { Router } from 'express';
import { getWeekAvailability } from '../utils/availability.js';
import { format, startOfWeek } from 'date-fns';

const router = Router();

// Public endpoint - no authentication required
router.get('/', (req, res) => {
  try {
    const { weekOf } = req.query;

    // Default to current week if not specified
    let weekOfDate: string;
    if (weekOf && typeof weekOf === 'string') {
      weekOfDate = weekOf;
    } else {
      weekOfDate = format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd');
    }

    const availability = getWeekAvailability(weekOfDate);

    res.json({
      weekOf: weekOfDate,
      availability,
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

export default router;
