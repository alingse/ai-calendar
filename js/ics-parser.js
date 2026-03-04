/**
 * ICS Parser - Parse iCalendar (.ics) files
 */

class ICSParser {
  constructor() {
    this.events = [];
  }

  /**
   * Parse ICS content
   * @param {string} content - Raw ICS content
   * @returns {Array} - Array of parsed events
   */
  parse(content) {
    this.events = [];
    const lines = this._unfoldLines(content);
    this._parseEvents(lines);
    return this.events;
  }

  /**
   * Unfold folded lines (continuation lines starting with space)
   * @param {string} content - Raw ICS content
   * @returns {Array} - Array of unfolded lines
   * @private
   */
  _unfoldLines(content) {
    const lines = [];
    const rawLines = content.split(/\r?\n/);
    let currentLine = '';

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];

      if (line.startsWith(' ') || line.startsWith('\t')) {
        // Continuation line
        currentLine += line.substring(1);
      } else {
        // New line
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = line;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Parse events from unfolded lines
   * @param {Array} lines - Array of unfolded lines
   * @private
   */
  _parseEvents(lines) {
    let currentEvent = null;
    let inEvent = false;

    for (const line of lines) {
      if (line === 'BEGIN:VEVENT') {
        inEvent = true;
        currentEvent = {};
      } else if (line === 'END:VEVENT') {
        if (currentEvent && currentEvent.dtstart) {
          this.events.push(currentEvent);
        }
        inEvent = false;
        currentEvent = null;
      } else if (inEvent && currentEvent) {
        this._parseEventLine(line, currentEvent);
      }
    }
  }

  /**
   * Parse a single event line
   * @param {string} line - The line to parse
   * @param {Object} event - The event object to populate
   * @private
   */
  _parseEventLine(line, event) {
    // Split by first colon
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return;

    const name = line.substring(0, colonIndex);
    const value = line.substring(colonIndex + 1);

    // Handle parameters (stuff before the colon but after semicolons)
    const nameParts = name.split(';');
    const propName = nameParts[0];

    switch (propName) {
      case 'UID':
        event.uid = value;
        break;
      case 'DTSTAMP':
        event.dtstamp = this.parseDate(value);
        break;
      case 'DTSTART':
        event.dtstart = this.parseDate(value);
        break;
      case 'DTEND':
        event.dtend = this.parseDate(value);
        break;
      case 'SUMMARY':
        event.summary = value;
        break;
      case 'DESCRIPTION':
        event.description = value;
        break;
      case 'LOCATION':
        event.location = value;
        break;
      case 'STATUS':
        event.status = value;
        break;
    }
  }

  /**
   * Parse ICS date string to JavaScript Date
   * @param {string} icsDate - ICS date string
   * @returns {Date} - JavaScript Date object
   */
  parseDate(icsDate) {
    // Handle timezone parameter (e.g., DTSTART;TZID=Asia/Shanghai:...)
    const cleanDate = icsDate.includes(':') ? icsDate.split(':')[1] : icsDate;

    // Parse format: 20250310T140000 or 20250310T140000Z
    const year = parseInt(cleanDate.substring(0, 4));
    const month = parseInt(cleanDate.substring(4, 6)) - 1;
    const day = parseInt(cleanDate.substring(6, 8));

    let hours = 0, minutes = 0, seconds = 0;

    if (cleanDate.includes('T')) {
      const timePart = cleanDate.substring(9);
      hours = parseInt(timePart.substring(0, 2));
      minutes = parseInt(timePart.substring(2, 4));
      seconds = parseInt(timePart.substring(4, 6));
    }

    // Check for UTC timezone (Z suffix)
    const isUTC = cleanDate.endsWith('Z');

    if (isUTC) {
      return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
    } else {
      return new Date(year, month, day, hours, minutes, seconds);
    }
  }

  /**
   * Load and parse ICS file from URL
   * @param {string} url - URL to the ICS file
   * @returns {Promise<Array>} - Promise that resolves to parsed events
   */
  async loadFromURL(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load ICS file: ${response.statusText}`);
      }
      const content = await response.text();
      return this.parse(content);
    } catch (error) {
      console.error('Error loading ICS file:', error);
      return [];
    }
  }

  /**
   * Filter events by date range
   * @param {Array} events - Array of events
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} - Filtered events
   */
  filterByDateRange(events, startDate, endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return events.filter(event => {
      return event.dtstart >= start && event.dtstart <= end;
    });
  }

  /**
   * Filter events by single date
   * @param {Array} events - Array of events
   * @param {Date} date - The date to filter by
   * @returns {Array} - Filtered events
   */
  filterByDate(events, date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return events.filter(event => {
      return event.dtstart >= start && event.dtstart <= end;
    });
  }

  /**
   * Sort events by start time
   * @param {Array} events - Array of events
   * @returns {Array} - Sorted events
   */
  sortEvents(events) {
    return events.sort((a, b) => a.dtstart - b.dtstart);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ICSParser;
}
