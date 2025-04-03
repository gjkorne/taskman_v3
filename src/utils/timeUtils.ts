/**
 * Utility functions for time and duration handling
 */

import { differenceInSeconds, format, parseISO, isSameDay as dateFnsIsSameDay, isSameWeek as dateFnsIsSameWeek, isSameMonth as dateFnsIsSameMonth } from 'date-fns';

/**
 * Parse PostgreSQL duration string to seconds
 * Handles various formats: "X seconds", "HH:MM:SS", "X hours Y mins Z secs"
 */
export function parseDurationToSeconds(durationStr: string | null): number {
  if (!durationStr) return 0;
  
  // Special case for null/undefined/empty
  if (!durationStr.trim()) return 0;
  
  // Try to parse "X seconds" format
  const secondsMatch = durationStr.match(/^(\d+) seconds?$/);
  if (secondsMatch) {
    const seconds = parseInt(secondsMatch[1], 10);
    if (!isNaN(seconds)) {
      return seconds;
    }
  }
  
  // Try to parse "hh:mm:ss" format
  const timeMatch = durationStr.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})(?:\.\d+)?$/);
  if (timeMatch) {
    const [, hours, minutes, seconds] = timeMatch;
    return parseInt(hours, 10) * 3600 + parseInt(minutes, 10) * 60 + parseInt(seconds, 10);
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
    return totalSeconds;
  }
  
  // Try to parse PostgreSQL verbose format
  let totalSeconds = 0;
  
  // Extract hours
  const hoursMatch = durationStr.match(/(\d+)\s+hour[s]?/);
  if (hoursMatch) {
    totalSeconds += parseInt(hoursMatch[1], 10) * 3600;
  }
  
  // Extract minutes
  const minsMatch = durationStr.match(/(\d+)\s+min[s]?/);
  if (minsMatch) {
    totalSeconds += parseInt(minsMatch[1], 10) * 60;
  }
  
  // Extract seconds
  const secsMatch = durationStr.match(/(\d+(?:\.\d+)?)\s+sec[s]?/);
  if (secsMatch) {
    totalSeconds += Math.floor(parseFloat(secsMatch[1]));
  }
  
  // If we still couldn't parse it, try one more format: "X days HH:MM:SS"
  if (totalSeconds === 0) {
    const daysTimeMatch = durationStr.match(/(?:(\d+)\s+days?\s+)?(\d{1,2}):(\d{2}):(\d{2})/);
    if (daysTimeMatch) {
      const [, days, hours, minutes, seconds] = daysTimeMatch;
      if (days) totalSeconds += parseInt(days, 10) * 24 * 3600;
      totalSeconds += parseInt(hours, 10) * 3600;
      totalSeconds += parseInt(minutes, 10) * 60;
      totalSeconds += parseInt(seconds, 10);
    }
  }
  
  return totalSeconds;
}

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
 * Calculate duration between two ISO date strings
 */
export function calculateDurationBetween(startTimeStr: string, endTimeStr: string | null): string {
  if (!startTimeStr || !endTimeStr) return '00:00:00';

  try {
    const startTime = parseISO(startTimeStr);
    const endTime = parseISO(endTimeStr);
    
    // Validate dates
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      console.error('Invalid start or end time', { startTimeStr, endTimeStr });
      return '00:00:00';
    }
    
    // Calculate seconds between dates using raw timestamp difference for accuracy
    const durationInSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    
    if (durationInSeconds <= 0) {
      console.warn('Negative or zero duration calculated between', startTimeStr, 'and', endTimeStr);
      return '00:00:00';
    }
    
    return formatSecondsToTime(durationInSeconds);
  } catch (error) {
    console.error('Error calculating duration between dates:', error);
    return '00:00:00';
  }
}

/**
 * Format a PostgreSQL duration string to "HH:MM:SS" format
 */
export function formatDuration(durationStr: string | null, startTime?: string, endTime?: string): string {
  // If we have valid start and end times, use those to calculate duration as a fallback
  if ((!durationStr || durationStr === '00:00:00') && startTime && endTime) {
    return calculateDurationBetween(startTime, endTime);
  }
  
  if (!durationStr) return '00:00:00';
  
  const totalSeconds = parseDurationToSeconds(durationStr);
  
  if (totalSeconds > 0) {
    return formatSecondsToTime(totalSeconds);
  }
  
  // If we get here, the duration string couldn't be parsed correctly
  // and we don't have start/end times to use as fallback
  console.warn('Failed to parse duration string:', durationStr);
  return '00:00:00';
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
 * Calculate duration between two ISO date strings
 * Returns duration in seconds
 */
export function calculateDurationBetweenOld(startTime: string, endTime: string): number {
  try {
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    return differenceInSeconds(end, start);
  } catch (error) {
    console.error('Error calculating duration between times:', error);
    return 0;
  }
}

/**
 * Format duration in a human-readable way (e.g. "2h 30m")
 */
export function formatDurationHumanReadable(durationStr: string | null): string {
  if (!durationStr) return '0m';
  
  const totalSeconds = parseDurationToSeconds(durationStr);
  
  // If the duration is very small (less than a minute), still show 1m to indicate some activity
  if (totalSeconds > 0 && totalSeconds < 60) {
    return '1m';
  }
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  if (hours === 0 && minutes === 0) {
    return totalSeconds > 0 ? '1m' : '0m';
  }
  
  if (hours > 0) {
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Format time for display in a consistent way across the application
 */
export function formatTimeForDisplay(timeStr: string): string {
  try {
    const date = parseISO(timeStr);
    return format(date, 'MMM d, yyyy h:mm a');
  } catch (error) {
    console.error('Error formatting time for display:', error);
    return timeStr;
  }
}

/**
 * Calculate duration of active session
 * For sessions without an end time
 */
export function calculateActiveSessionDuration(startTime: string): string {
  try {
    // First parse the start time
    const start = parseISO(startTime);
    
    // Ensure start time is valid
    if (isNaN(start.getTime())) {
      console.error('Invalid start time for active session:', startTime);
      return '00:00:00';
    }
    
    // For sessions that would be in the future (due to timezone issues), return zero
    if (start > new Date()) {
      console.warn('Start time is in the future:', startTime);
      return '00:00:00';
    }
    
    // Calculate the difference from now
    const now = new Date();
    const durationInSeconds = differenceInSeconds(now, start);
    
    // Ensure the duration is not negative
    if (durationInSeconds < 0) {
      console.warn('Negative duration calculated:', durationInSeconds);
      return '00:00:00';
    }
    
    return formatSecondsToTime(durationInSeconds);
  } catch (error) {
    console.error('Error calculating active session duration:', error);
    return '00:00:00';
  }
}

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
