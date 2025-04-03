/**
 * Types for the task list feature
 * This allows tasks to contain structured lists (e.g., shopping lists, checklists)
 */

/**
 * Individual list item
 */
export interface ListItem {
  id: string;
  text: string;
  completed: boolean;
  order: number;
  createdAt?: string;
}

/**
 * All available note formats
 */
export enum NoteFormat {
  TEXT = 'text',
  LIST = 'list'
}

/**
 * Structure for list-type notes
 */
export interface ListNotes {
  format: NoteFormat.LIST;
  items: ListItem[];
}

/**
 * Structure for text-type notes
 */
export interface TextNotes {
  format: NoteFormat.TEXT;
  content: string;
}

/**
 * Union type for all note formats
 */
export type Notes = ListNotes | TextNotes;

/**
 * Utility to create empty list notes
 */
export function createEmptyListNotes(): ListNotes {
  return {
    format: NoteFormat.LIST,
    items: []
  };
}

/**
 * Utility to create empty text notes
 */
export function createEmptyTextNotes(): TextNotes {
  return {
    format: NoteFormat.TEXT,
    content: ''
  };
}

/**
 * Utility to parse notes in any format
 */
export function parseNotes(notesData: string | null): Notes {
  if (!notesData) {
    return createEmptyTextNotes();
  }
  
  try {
    const parsed = JSON.parse(notesData);
    
    // Check if it has a valid format property
    if (parsed && parsed.format) {
      if (parsed.format === NoteFormat.LIST && Array.isArray(parsed.items)) {
        return parsed as ListNotes;
      } else if (parsed.format === NoteFormat.TEXT && typeof parsed.content === 'string') {
        return parsed as TextNotes;
      }
    }
    
    // If it doesn't match our expected format but has content, treat as legacy text notes
    if (typeof notesData === 'string') {
      return {
        format: NoteFormat.TEXT,
        content: notesData
      };
    }
  } catch (error) {
    // If parsing fails, treat as plain text
    return {
      format: NoteFormat.TEXT,
      content: notesData
    };
  }
  
  // Default fallback
  return createEmptyTextNotes();
}

/**
 * Utility to stringify notes for storage
 */
export function stringifyNotes(notes: Notes): string {
  return JSON.stringify(notes);
}
