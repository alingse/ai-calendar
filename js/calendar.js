/**
 * Calendar - Main calendar functionality
 */

class Navigation {
  constructor() {
    this.currentDate = new Date();
    this.weekStart = 1; // Monday
  }

  getWeekStart() {
    return DateUtils.getWeekStart(this.currentDate, this.weekStart);
  }

  getWeekEnd() {
    const start = this.getWeekStart();
    return DateUtils.addDays(start, 6);
  }

  goToPrevWeek() {
    this.currentDate = DateUtils.addDays(this.currentDate, -7);
  }

  goToNextWeek() {
    this.currentDate = DateUtils.addDays(this.currentDate, 7);
  }

  goToToday() {
    this.currentDate = new Date();
  }

  goToWeek(date) {
    this.currentDate = new Date(date);
  }
}

class EventManager {
  constructor(icsUrl) {
    this.icsUrl = icsUrl;
    this.parser = new ICSParser();
    this.events = [];
    this.isLoading = false;
  }

  async loadEvents() {
    this.isLoading = true;
    try {
      this.events = await this.parser.loadFromURL(this.icsUrl);
    } catch (error) {
      console.error('Failed to load events:', error);
      this.events = [];
    } finally {
      this.isLoading = false;
    }
    return this.events;
  }

  getEventsForWeek(weekStart) {
    const weekEnd = DateUtils.addDays(weekStart, 6);
    const filtered = this.parser.filterByDateRange(this.events, weekStart, weekEnd);
    return this.parser.sortEvents(filtered);
  }

  getEventsForDate(date) {
    const filtered = this.parser.filterByDate(this.events, date);
    return this.parser.sortEvents(filtered);
  }
}

class WeekView {
  constructor(options = {}) {
    this.options = {
      icsUrl: 'data/events.ics',
      timeStart: 8, // 8:00 AM
      timeEnd: 23,  // 11:00 PM
      lunchStart: 12, // 12:00 PM
      lunchEnd: 13,   // 1:00 PM
      hourHeight: 50, // pixels per hour
      ...options
    };

    this.navigation = new Navigation();
    this.eventManager = new EventManager(this.options.icsUrl);
    this.elements = {};
  }

  async init() {
    this.cacheElements();
    this.bindEvents();
    await this.loadEvents();
    this.render();
  }

  cacheElements() {
    this.elements = {
      dateRange: document.getElementById('dateRange'),
      prevWeek: document.getElementById('prevWeek'),
      nextWeek: document.getElementById('nextWeek'),
      todayBtn: document.getElementById('todayBtn'),
      timeLabels: document.getElementById('timeLabels'),
      dayHeaders: document.getElementById('dayHeaders'),
      dayCells: document.getElementById('dayCells'),
      calendarGrid: document.getElementById('calendarGrid')
    };
  }

  bindEvents() {
    this.elements.prevWeek.addEventListener('click', () => {
      this.navigation.goToPrevWeek();
      this.render();
    });

    this.elements.nextWeek.addEventListener('click', () => {
      this.navigation.goToNextWeek();
      this.render();
    });

    this.elements.todayBtn.addEventListener('click', () => {
      this.navigation.goToToday();
      this.render();
    });
  }

  async loadEvents() {
    await this.eventManager.loadEvents();
  }

  render() {
    this.renderDateRange();
    this.renderTimeLabels();
    this.renderDayHeaders();
    this.renderGrid();
    this.renderEvents();
  }

  renderDateRange() {
    const weekStart = this.navigation.getWeekStart();
    const weekEnd = this.navigation.getWeekEnd();
    const dateRangeText = DateUtils.formatDateRange(weekStart, weekEnd);
    this.elements.dateRange.textContent = dateRangeText;
  }

  renderTimeLabels() {
    const timeLabels = this.elements.timeLabels;
    timeLabels.innerHTML = '';

    for (let hour = this.options.timeStart; hour <= this.options.timeEnd; hour++) {
      const label = document.createElement('div');
      label.className = 'time-label';
      label.style.top = `${(hour - this.options.timeStart) * this.options.hourHeight}px`;
      label.textContent = `${hour.toString().padStart(2, '0')}:00`;
      timeLabels.appendChild(label);
    }
  }

  renderDayHeaders() {
    const dayHeaders = this.elements.dayHeaders;
    dayHeaders.innerHTML = '';

    const weekStart = this.navigation.getWeekStart();
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = DateUtils.addDays(weekStart, i);
      const header = document.createElement('div');
      header.className = 'day-header';

      if (DateUtils.isSameDay(date, today)) {
        header.classList.add('today');
      }

      const dayName = document.createElement('span');
      dayName.className = 'day-name';
      dayName.textContent = DateUtils.getDayName(date);

      const dayDate = document.createElement('span');
      dayDate.className = 'day-date';
      dayDate.textContent = `${date.getMonth() + 1}/${date.getDate()}`;

      header.appendChild(dayName);
      header.appendChild(dayDate);
      dayHeaders.appendChild(header);
    }
  }

  renderGrid() {
    const dayCells = this.elements.dayCells;
    dayCells.innerHTML = '';

    // Calculate total height
    const totalHours = this.options.timeEnd - this.options.timeStart + 1;
    const totalHeight = totalHours * this.options.hourHeight;
    dayCells.style.height = `${totalHeight}px`;
    dayCells.style.position = 'relative';

    // Create grid lines
    const gridLines = document.createElement('div');
    gridLines.className = 'grid-lines';

    for (let hour = this.options.timeStart; hour <= this.options.timeEnd; hour++) {
      // Hour line
      const hourLine = document.createElement('div');
      hourLine.className = 'hour-line';
      hourLine.style.top = `${(hour - this.options.timeStart) * this.options.hourHeight}px`;
      gridLines.appendChild(hourLine);

      // Half-hour line
      if (hour < this.options.timeEnd) {
        const halfHourLine = document.createElement('div');
        halfHourLine.className = 'hour-line half-hour';
        halfHourLine.style.top = `${(hour - this.options.timeStart + 0.5) * this.options.hourHeight}px`;
        gridLines.appendChild(halfHourLine);
      }
    }

    dayCells.appendChild(gridLines);

    // Create day columns
    const weekStart = this.navigation.getWeekStart();
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = DateUtils.addDays(weekStart, i);
      const dayCell = document.createElement('div');
      dayCell.className = 'day-cell';
      dayCell.style.left = `${(i / 7) * 100}%`;
      dayCell.style.width = `${100 / 7}%`;
      dayCell.dataset.date = date.toISOString();

      if (DateUtils.isSameDay(date, today)) {
        dayCell.classList.add('today');
      }

      dayCells.appendChild(dayCell);
    }

    // Render lunch time block
    this.renderLunchTime(dayCells);
  }

  renderLunchTime(container) {
    const lunchStart = this.options.lunchStart;
    const lunchEnd = this.options.lunchEnd;
    const duration = lunchEnd - lunchStart;

    const top = (lunchStart - this.options.timeStart) * this.options.hourHeight;
    const height = duration * this.options.hourHeight;

    // Create lunch time blocks for each day
    for (let i = 0; i < 7; i++) {
      const lunchBlock = document.createElement('div');
      lunchBlock.className = 'lunch-time';
      lunchBlock.style.top = `${top}px`;
      lunchBlock.style.height = `${height}px`;
      lunchBlock.style.left = `${(i / 7) * 100}%`;
      lunchBlock.style.width = `${100 / 7}%`;
      lunchBlock.textContent = 'Lunch';
      container.appendChild(lunchBlock);
    }
  }

  renderEvents() {
    const dayCells = this.elements.dayCells;
    const weekStart = this.navigation.getWeekStart();
    const events = this.eventManager.getEventsForWeek(weekStart);

    // Remove existing event elements
    const existingEvents = dayCells.querySelectorAll('.event-item');
    existingEvents.forEach(el => el.remove());

    // Group events by day
    const eventsByDay = {};
    for (let i = 0; i < 7; i++) {
      eventsByDay[i] = [];
    }

    for (const event of events) {
      const dayIndex = this.getDayIndex(weekStart, event.dtstart);
      if (dayIndex >= 0 && dayIndex < 7) {
        eventsByDay[dayIndex].push(event);
      }
    }

    // Render events for each day
    for (let i = 0; i < 7; i++) {
      this.renderDayEvents(dayCells, i, eventsByDay[i]);
    }
  }

  renderDayEvents(container, dayIndex, events) {
    for (const event of events) {
      const eventEl = this.createEventElement(event);
      eventEl.style.left = `${(dayIndex / 7) * 100}%`;
      eventEl.style.width = `${100 / 7}%`;
      container.appendChild(eventEl);
    }
  }

  createEventElement(event) {
    const el = document.createElement('div');
    el.className = 'event-item';
    el.dataset.uid = event.uid;

    const startMinutes = DateUtils.getMinutesFromMidnight(event.dtstart);
    const endMinutes = DateUtils.getMinutesFromMidnight(event.dtend);

    const top = ((startMinutes / 60) - this.options.timeStart) * this.options.hourHeight;
    const height = ((endMinutes - startMinutes) / 60) * this.options.hourHeight;

    el.style.top = `${top}px`;
    el.style.height = `${height}px`;

    const title = document.createElement('div');
    title.className = 'event-title';
    title.textContent = event.summary || 'Untitled';

    const time = document.createElement('div');
    time.className = 'event-time';
    time.textContent = `${DateUtils.formatTime(event.dtstart)} - ${DateUtils.formatTime(event.dtend)}`;

    el.appendChild(title);
    el.appendChild(time);

    return el;
  }

  getDayIndex(weekStart, eventDate) {
    const dayDiff = Math.floor((eventDate - weekStart) / (1000 * 60 * 60 * 24));
    return dayDiff;
  }

  refresh() {
    this.eventManager.loadEvents().then(() => {
      this.render();
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WeekView, EventManager, Navigation };
}
