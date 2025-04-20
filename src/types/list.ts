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
  LIST = 'list',
  BOTH = 'both',
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
 * Structure for combined notes (both text and list)
 */
export interface CombinedNotes {
  format: NoteFormat.BOTH;
  content: string;
  items: ListItem[];
}

/**
 * Union type for all note formats
 */
export type Notes = ListNotes | TextNotes | CombinedNotes;

/**
 * Utility to create empty list notes
 */
export function createEmptyListNotes(): ListNotes {
  return {
    format: NoteFormat.LIST,
    items: [],
  };
}

/**
 * Utility to create empty text notes
 */
export function createEmptyTextNotes(): TextNotes {
  return {
    format: NoteFormat.TEXT,
    content: '',
  };
}

/**
 * Utility to create empty combined notes
 */
export function createEmptyCombinedNotes(): CombinedNotes {
  return {
    format: NoteFormat.BOTH,
    content: '',
    items: [],
  };
}

/**
 * Convert existing notes to combined format
 */
export function toCombinedNotes(notes: Notes): CombinedNotes {
  if (notes.format === NoteFormat.BOTH) {
    return notes as CombinedNotes;
  }

  if (notes.format === NoteFormat.LIST) {
    return {
      format: NoteFormat.BOTH,
      content: '',
      items: (notes as ListNotes).items,
    };
  }

  return {
    format: NoteFormat.BOTH,
    content: (notes as TextNotes).content,
    items: [],
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
      } else if (
        parsed.format === NoteFormat.TEXT &&
        typeof parsed.content === 'string'
      ) {
        return parsed as TextNotes;
      } else if (
        parsed.format === NoteFormat.BOTH &&
        typeof parsed.content === 'string' &&
        Array.isArray(parsed.items)
      ) {
        return parsed as CombinedNotes;
      }
    }

    // If it doesn't match our expected format but has content, treat as legacy text notes
    if (typeof notesData === 'string') {
      return {
        format: NoteFormat.TEXT,
        content: notesData,
      };
    }
  } catch (error) {
    // If parsing fails, treat as plain text
    return {
      format: NoteFormat.TEXT,
      content: notesData,
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

/**
 * Convert to proper format for database storage
 * This maps to our new database structure with notes and checklist_items
 */
export function notesToDatabaseFormat(notes: Notes): {
  notes: any;
  checklist_items: any[];
  note_type: string;
} {
  if (notes.format === NoteFormat.TEXT) {
    return {
      notes: { format: NoteFormat.TEXT, content: (notes as TextNotes).content },
      checklist_items: [],
      note_type: 'text',
    };
  } else if (notes.format === NoteFormat.LIST) {
    return {
      notes: null,
      checklist_items: (notes as ListNotes).items,
      note_type: 'checklist',
    };
  } else {
    // Combined format
    return {
      notes: {
        format: NoteFormat.TEXT,
        content: (notes as CombinedNotes).content,
      },
      checklist_items: (notes as CombinedNotes).items,
      note_type: 'both',
    };
  }
}

/**
 * Convert from database format to Notes object
 */
export function databaseToNotesFormat(
  dbNotes: any,
  dbChecklist: any[],
  noteType: string
): Notes {
  if (noteType === 'both') {
    return {
      format: NoteFormat.BOTH,
      content: dbNotes?.content || '',
      items: Array.isArray(dbChecklist) ? dbChecklist : [],
    };
  } else if (noteType === 'checklist') {
    return {
      format: NoteFormat.LIST,
      items: Array.isArray(dbChecklist) ? dbChecklist : [],
    };
  } else {
    // Default to text
    return {
      format: NoteFormat.TEXT,
      content: dbNotes?.content || (typeof dbNotes === 'string' ? dbNotes : ''),
    };
  }
}
