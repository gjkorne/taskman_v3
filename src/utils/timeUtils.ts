/**
 * Utility functions for time and duration handling
 */

import { differenceInSeconds, format, parseISO, isSameDay as dateFnsIsSameDay, isSameWeek as dateFnsIsSameWeek, isSameMonth as dateFnsIsSameMonth } from 'date-fns';

//=========================================================
// DURATION PARSING FUNCTIONS
//=========================================================

// Debug flag - set to false to disable logging
const DEBUG_DURATION_PARSING = false;

/**
 * Parse PostgreSQL duration string to seconds
 * Handles various formats: "X seconds", "HH:MM:SS", "X hours Y mins Z secs"
 */
export function parseDurationToSeconds(durationStr: string | null): number {
  if (!durationStr) return 0;
  
  // Special case for null/undefined/empty
  if (!durationStr.trim()) return 0;
  
  const originalInput = durationStr; // Store for debugging
  let result = 0;
  
  // Try to parse "X seconds" format
  const secondsMatch = durationStr.match(/^(\d+) seconds?$/);
  if (secondsMatch) {
    const seconds = parseInt(secondsMatch[1], 10);
    if (!isNaN(seconds)) {
      if (DEBUG_DURATION_PARSING) console.log(`Parsed duration "${originalInput}" as ${seconds} seconds (direct seconds format)`);
      return seconds;
    }
  }
  
  // Try to parse "hh:mm:ss" format
  const timeMatch = durationStr.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})(?:\.\d+)?$/);
  if (timeMatch) {
    const [, hours, minutes, seconds] = timeMatch;
    result = parseInt(hours, 10) * 3600 + parseInt(minutes, 10) * 60 + parseInt(seconds, 10);
    if (DEBUG_DURATION_PARSING) console.log(`Parsed duration "${originalInput}" as ${result} seconds (HH:MM:SS format)`);
    return result;
  }
  
  // Try to parse PostgreSQL ISO 8601 format: P0Y0M0DT0H30M0S
  const isoMatch = durationStr.match(/P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)(?:\.\d+)?S)?/i);
  if (isoMatch) {
    const [, years, months, days, hours, minutes, seconds] = isoMatch;
    let totalSeconds = 0;
    if (years) totalSeconds += parseInt(years, 10) * 365 * 24 * 3600;
    if (months) totalSeconds += parseInt(months, 10) * 30 * 24 * 3600;
    if (days) totalSeconds += parseInt(days, 10) * 24 * 3600;
    if (hours) totalSeconds += parseInt(hours, 10) * 3600;
    if (minutes) totalSeconds += parseInt(minutes, 10) * 60;
    if (seconds) totalSeconds += parseInt(seconds, 10);
    if (DEBUG_DURATION_PARSING) console.log(`Parsed duration "${originalInput}" as ${totalSeconds} seconds (ISO format)`);
    return totalSeconds;
  }
  
  // Try to parse PostgreSQL verbose format
  let totalSeconds = 0;
  let matched = false;
  
  // Extract hours
  const hoursMatch = durationStr.match(/(\d+)\s+hour[s]?/);
  if (hoursMatch) {
    totalSeconds += parseInt(hoursMatch[1], 10) * 3600;
    matched = true;
  }
  
  // Extract minutes
  const minsMatch = durationStr.match(/(\d+)\s+min[s]?/);
  if (minsMatch) {
    totalSeconds += parseInt(minsMatch[1], 10) * 60;
    matched = true;
  }
  
  // Extract seconds
  const secsMatch = durationStr.match(/(\d+(?:\.\d+)?)\s+sec[s]?/);
  if (secsMatch) {
    totalSeconds += Math.floor(parseFloat(secsMatch[1]));
    matched = true;
  }
  
  if (matched) {
    if (DEBUG_DURATION_PARSING) console.log(`Parsed duration "${originalInput}" as ${totalSeconds} seconds (verbose format)`);
    return totalSeconds;
  }
  
  // Try to parse "X days HH:MM:SS" format
  const daysTimeMatch = durationStr.match(/(?:(\d+)\s+days?\s+)?(\d{1,2}):(\d{2}):(\d{2})/);
  if (daysTimeMatch) {
    const [, days, hours, minutes, seconds] = daysTimeMatch;
    if (days) totalSeconds += parseInt(days, 10) * 24 * 3600;
    totalSeconds += parseInt(hours, 10) * 3600;
    totalSeconds += parseInt(minutes, 10) * 60;
    totalSeconds += parseInt(seconds, 10);
    if (DEBUG_DURATION_PARSING) console.log(`Parsed duration "${originalInput}" as ${totalSeconds} seconds (days + HH:MM:SS format)`);
    return totalSeconds;
  }
  
  // Try to parse PostgreSQL interval notation: e.g., "00:15:00"
  const pgIntervalMatch = durationStr.match(/^(\d{2}):(\d{2}):(\d{2})$/);
  if (pgIntervalMatch) {
    const [, hours, minutes, seconds] = pgIntervalMatch;
    result = parseInt(hours, 10) * 3600 + parseInt(minutes, 10) * 60 + parseInt(seconds, 10);
    if (DEBUG_DURATION_PARSING) console.log(`Parsed duration "${originalInput}" as ${result} seconds (PostgreSQL interval notation)`);
    return result;
  }
  
  // Try to parse microseconds format (e.g. "15:00:00.123456")
  const microsecondsMatch = durationStr.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{1,6})$/);
  if (microsecondsMatch) {
    const [, hours, minutes, seconds] = microsecondsMatch;
    result = parseInt(hours, 10) * 3600 + parseInt(minutes, 10) * 60 + parseInt(seconds, 10);
    if (DEBUG_DURATION_PARSING) console.log(`Parsed duration "${originalInput}" as ${result} seconds (microseconds format)`);
    return result;
  }
  
  // If we still couldn't parse, log it and return 0
  if (DEBUG_DURATION_PARSING) console.warn(`Failed to parse duration format: "${originalInput}"`);
  return 0;
}

//=========================================================
// TIME FORMATTING FUNCTIONS
//=========================================================

/**
 * Format seconds to "HH:MM:SS" string
 */
export function formatSecondsToTime(totalSeconds: number): string {
  // Ensure totalSeconds is an integer
  totalSeconds = Math.floor(totalSeconds);
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0')
  ].join(':');
}

/**
 * Format milliseconds to "HH:MM:SS" string
 * Similar to formatSecondsToTime but takes milliseconds as input
 */
export function formatMillisecondsToTime(totalMs: number): string {
  // Convert ms to seconds first
  return formatSecondsToTime(Math.floor(totalMs / 1000));
}

/**
 * Format duration in a human-readable way (e.g. "2h 30m")
 * @param duration Duration as string or number of seconds
 */
export function formatDurationHumanReadable(duration: string | number | null): string {
  if (duration === null) return '0m';
  
  let totalSeconds: number;
  if (typeof duration === 'number') {
    totalSeconds = duration;
    if (DEBUG_DURATION_PARSING) console.log(`formatDurationHumanReadable: using number input directly: ${totalSeconds}s`);
  } else {
    totalSeconds = parseDurationToSeconds(duration);
    if (DEBUG_DURATION_PARSING) console.log(`formatDurationHumanReadable: parsed from string: "${duration}" → ${totalSeconds}s`);
  }
  
  if (totalSeconds === 0) return '0m';
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  let result = '';
  if (hours > 0) {
    result += `${hours}h `;
  }
  
  if (minutes > 0 || (hours > 0 && seconds > 0)) {
    result += `${minutes}m`;
  } else if (hours === 0 && minutes === 0) {
    // If less than a minute, show seconds
    result = `${seconds}s`;
  }
  
  return result.trim();
}

/**
 * Format a PostgreSQL duration string to "HH:MM:SS" format
 */
export function formatDuration(durationStr: string | null, startTime?: string, endTime?: string): string {
  // Handle missing duration with start/end time calculation
  if ((!durationStr || durationStr.trim() === '') && startTime && endTime) {
    return calculateDurationBetween(startTime, endTime);
  }
  
  // Parse duration to seconds and format
  const totalSeconds = parseDurationToSeconds(durationStr);
  return formatSecondsToTime(totalSeconds);
}

/**
 * Format time for display in a consistent way across the application
 */
export function formatTimeForDisplay(timeStr: string): string {
  try {
    return format(parseISO(timeStr), 'h:mm a');
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeStr; // Return original string if formatting fails
  }
}

/**
 * Format time for display in a consistent way across the application
 */
export function formatTime(time: Date): string {
  return format(time, 'h:mm a');
}

//=========================================================
// DURATION CALCULATION FUNCTIONS
//=========================================================

/**
 * Calculate duration between two ISO date strings
 */
export function calculateDurationBetween(startTimeStr: string, endTimeStr: string | null): string {
  if (!startTimeStr || !endTimeStr) {
    return '00:00:00';
  }
  
  try {
    const startTime = parseISO(startTimeStr);
    const endTime = parseISO(endTimeStr);
    
    // Ensure valid dates
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      console.error('Invalid date format for duration calculation');
      return '00:00:00';
    }
    
    // Calculate total seconds
    const totalSeconds = Math.max(0, differenceInSeconds(endTime, startTime));
    return formatSecondsToTime(totalSeconds);
  } catch (error) {
    console.error('Error calculating duration:', error);
    return '00:00:00';
  }
}

/**
 * Calculate total duration from an array of sessions
 */
export function calculateTotalDuration(sessions: Array<{ duration: string | null }>): string {
  let totalSeconds = 0;
  
  sessions.forEach(session => {
    if (session.duration) {
      totalSeconds += parseDurationToSeconds(session.duration);
    }
  });
  
  return formatSecondsToTime(totalSeconds);
}

/**
 * Calculate duration of active session (for sessions without an end time)
 */
export function calculateActiveSessionDuration(startTime: string): string {
  if (!startTime) {
    return '00:00:00';
  }
  
  try {
    const startDate = parseISO(startTime);
    const now = new Date();
    
    // Ensure valid date
    if (isNaN(startDate.getTime())) {
      console.error('Invalid start time format for active session calculation');
      return '00:00:00';
    }
    
    // Calculate elapsed seconds
    const elapsedSeconds = Math.max(0, differenceInSeconds(now, startDate));
    return formatSecondsToTime(elapsedSeconds);
  } catch (error) {
    console.error('Error calculating active session duration:', error);
    return '00:00:00';
  }
}

/**
 * Calculate duration between two ISO date strings
 * Returns duration in seconds
 * @deprecated Use calculateDurationBetween instead which returns a formatted string
 */
export function calculateDurationBetweenOld(startTime: string, endTime: string): number {
  try {
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    return Math.max(0, differenceInSeconds(end, start));
  } catch (error) {
    console.error('Error calculating duration in seconds:', error);
    return 0;
  }
}

//=========================================================
// DATE COMPARISON FUNCTIONS
//=========================================================

/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  
  return dateFnsIsSameDay(d1, d2);
}

/**
 * Check if two dates are in the same week
 * Considers week to start on Monday by default
 */
export function isSameWeek(date1: Date | string, date2: Date | string, weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1): boolean {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  
  return dateFnsIsSameWeek(d1, d2, { weekStartsOn });
}

/**
 * Check if two dates are in the same month
 */
export function isSameMonth(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  
  return dateFnsIsSameMonth(d1, d2);
}

//=========================================================
// POSTGRES INTERVAL HELPER FUNCTIONS
//=========================================================

/**
 * Convert milliseconds to PostgreSQL interval format
 * @param ms Milliseconds to convert 
 * @returns PostgreSQL compatible interval string
 */
export function msToPostgresInterval(ms: number): string {
  if (ms <= 0) return 'PT0S';
  const seconds = Math.floor(ms / 1000);
  return `${seconds} seconds`;
}
