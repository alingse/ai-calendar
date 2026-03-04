/**
 * Date Utilities
 */

const DateUtils = {
  /**
   * Get the start of the week for a given date
   * @param {Date} date - The reference date
   * @param {number} weekStart - Day of week (0=Sunday, 1=Monday)
   * @returns {Date} - Start of the week
   */
  getWeekStart(date, weekStart = 1) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day - weekStart + 7) % 7;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  /**
   * Get the end of the week for a given date
   * @param {Date} date - The reference date
   * @param {number} weekStart - Day of week (0=Sunday, 1=Monday)
   * @returns {Date} - End of the week
   */
  getWeekEnd(date, weekStart = 1) {
    const start = this.getWeekStart(date, weekStart);
    const weekEnd = new Date(start);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  },

  /**
   * Add days to a date
   * @param {Date} date - The reference date
   * @param {number} days - Number of days to add
   * @returns {Date} - New date with days added
   */
  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  /**
   * Format date to localized string
   * @param {Date} date - The date to format
   * @param {string} locale - Locale for formatting
   * @param {Object} options - Intl.DateTimeFormat options
   * @returns {string} - Formatted date string
   */
  formatDate(date, locale = 'zh-CN', options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString(locale, { ...defaultOptions, ...options });
  },

  /**
   * Format time to localized string
   * @param {Date} date - The date to format
   * @param {string} locale - Locale for formatting
   * @returns {string} - Formatted time string
   */
  formatTime(date, locale = 'zh-CN') {
    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  },

  /**
   * Format date range string
   * @param {Date} start - Start date
   * @param {Date} end - End date
   * @param {string} locale - Locale for formatting
   * @returns {string} - Formatted date range
   */
  formatDateRange(start, end, locale = 'zh-CN') {
    const startMonth = start.getMonth();
    const endMonth = end.getMonth();
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    if (startYear !== endYear) {
      // Different years
      return `${this.formatDate(start, locale, { month: 'short', year: 'numeric', day: 'numeric' })} - ${this.formatDate(end, locale, { month: 'short', year: 'numeric', day: 'numeric' })}`;
    } else if (startMonth !== endMonth) {
      // Different months
      return `${this.formatDate(start, locale, { month: 'short', day: 'numeric' })} - ${this.formatDate(end, locale, { month: 'short', day: 'numeric' })}, ${startYear}`;
    } else {
      // Same month
      return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}, ${startYear}`;
    }
  },

  /**
   * Get day name
   * @param {Date} date - The date
   * @param {string} locale - Locale for formatting
   * @returns {string} - Day name
   */
  getDayName(date, locale = 'zh-CN') {
    return date.toLocaleDateString(locale, { weekday: 'short' });
  },

  /**
   * Check if two dates are the same day
   * @param {Date} date1 - First date
   * @param {Date} date2 - Second date
   * @returns {boolean} - True if same day
   */
  isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  },

  /**
   * Check if a date is today
   * @param {Date} date - The date to check
   * @returns {boolean} - True if today
   */
  isToday(date) {
    return this.isSameDay(date, new Date());
  },

  /**
   * Get time offset from midnight in minutes
   * @param {Date} date - The date
   * @returns {number} - Minutes from midnight
   */
  getMinutesFromMidnight(date) {
    return date.getHours() * 60 + date.getMinutes();
  },

  /**
   * Create date from time string
   * @param {Date} baseDate - Base date
   * @param {string} timeString - Time string (HH:MM)
   * @returns {Date} - New date with specified time
   */
  setTime(baseDate, timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const result = new Date(baseDate);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DateUtils;
}
