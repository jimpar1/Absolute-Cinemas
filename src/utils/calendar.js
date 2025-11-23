/**
 * Calendar / date utilities.
 * Pure functions for building week and month grids and matching screenings to dates.
 */

/**
 * Returns an array of 7 Date objects representing the days of the week
 * starting from the given Monday.
 * @param {Date} weekStart - The Monday that starts the week
 * @returns {Date[]} Seven consecutive dates starting from weekStart
 */
export function getWeekDays(weekStart) {
    const days = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        days.push(day);
    }
    return days;
}

/**
 * Returns an array of Date objects (and nulls for padding) representing
 * every cell in a monthly calendar grid (Mon–Sun layout).
 * Null entries pad the start so the first day aligns to its weekday column.
 * @param {Date} month - Any date within the target month
 * @returns {(Date|null)[]} Calendar grid cells
 */
export function getMonthDays(month) {
    const year = month.getFullYear();
    const m = month.getMonth();
    const firstDay = new Date(year, m, 1);
    const lastDay = new Date(year, m + 1, 0);
    const days = [];

    // Padding so Monday = column 0
    const startPadding = (firstDay.getDay() + 6) % 7;
    for (let i = 0; i < startPadding; i++) {
        days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push(new Date(year, m, i));
    }
    return days;
}

/**
 * Filters a list of screenings to only those whose start_time falls on the given date.
 * @param {object[]} screenings - Array of screening objects with a start_time field
 * @param {Date} date - The date to match
 * @returns {object[]} Screenings on that date
 */
export function getScreeningsForDate(screenings, date) {
    if (!date) return [];
    return screenings.filter(s => {
        const screeningDate = new Date(s.start_time);
        return screeningDate.toDateString() === date.toDateString();
    });
}

/**
 * Checks whether a date is today.
 * @param {Date} date - The date to check
 * @returns {boolean} True if the date is today
 */
export function isToday(date) {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
}
