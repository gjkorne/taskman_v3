/**
 * Utility functions for time and duration handling
 */

/**
 * Parse PostgreSQL duration string to seconds
 * Handles various formats: "X seconds", "HH:MM:SS", "X hours Y mins Z secs"
 */
export function parseDurationToSeconds(durationStr: string | null): number {
  if (!durationStr) return 0;
  
  // Try to parse "X seconds" format
  const secondsMatch = durationStr.match(/^(\d+) seconds?$/);
  if (secondsMatch) {
    const seconds = parseInt(secondsMatch[1], 10);
    if (!isNaN(seconds)) {
      return seconds;
    }
  }
  
  // Try to parse "hh:mm:ss" format
  const timeMatch = durationStr.match(/^(\d{2}):(\d{2}):(\d{2})$/);
  if (timeMatch) {
    const [, hours, minutes, seconds] = timeMatch;
    return parseInt(hours, 10) * 3600 + parseInt(minutes, 10) * 60 + parseInt(seconds, 10);
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
  const secsMatch = durationStr.match(/(\d+)\s+sec[s]?/);
  if (secsMatch) {
    totalSeconds += parseInt(secsMatch[1], 10);
  }
  
  return totalSeconds;
}

/**
 * Format seconds to "HH:MM:SS" string
 */
export function formatSecondsToTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0')
  ].join(':');
}

/**
 * Format a PostgreSQL duration string to "HH:MM:SS" format
 */
export function formatDuration(durationStr: string | null): string {
  if (!durationStr) return '00:00:00';
  
  const totalSeconds = parseDurationToSeconds(durationStr);
  
  if (totalSeconds > 0) {
    return formatSecondsToTime(totalSeconds);
  }
  
  // If parsing failed, return the original string or default
  console.warn('Unable to parse duration format:', durationStr);
  return durationStr || '00:00:00';
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
