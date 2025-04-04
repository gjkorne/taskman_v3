import React, { useState, useEffect } from 'react';
import { 
  ListNotes, 
  TextNotes, 
  CombinedNotes,
  Notes, 
  NoteFormat, 
  createEmptyListNotes, 
  createEmptyTextNotes,
  createEmptyCombinedNotes,
  parseNotes, 
  stringifyNotes,
  toCombinedNotes
} from '../../types/list';
import ListEditor from './ListEditor';
import { ListChecks, FileText, Layers } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsCompat';

interface NotesEditorProps {
  value: string | null;
  onChange: (notes: string) => void;
  readOnly?: boolean;
  className?: string;
}

/**
 * NotesEditor component
 * Displays either a text editor, list editor, or both based on the note format
 */
export const NotesEditor: React.FC<NotesEditorProps> = ({
  value,
  onChange,
  readOnly = false,
  className = '',
}) => {
  const { settings } = useSettings();
  const allowTaskSwitching = settings.allowTaskSwitching;
  
  // Parse the notes string into a structured Notes object or create a default list if empty
  const [notes, setNotes] = useState<Notes>(() => {
    const parsedNotes = parseNotes(value);
    
    // If it's a new note (empty), default to list format
    if (!value) {
      return createEmptyListNotes();
    }
    
    return parsedNotes;
  });
  
  // Update internal state when props change
  useEffect(() => {
    if (value) {
      setNotes(parseNotes(value));
    }
  }, [value]);

  // Handle switching between note formats
  const switchFormat = (format: NoteFormat) => {
    if (format === notes.format) return;
    
    let newNotes: Notes;
    
    if (allowTaskSwitching) {
      // If task switching is allowed, replace the content type completely
      if (format === NoteFormat.LIST) {
        newNotes = createEmptyListNotes();
      } else if (format === NoteFormat.TEXT) {
        newNotes = createEmptyTextNotes();
      } else {
        newNotes = createEmptyCombinedNotes();
      }
    } else {
      // Preserve content when switching formats
      if (format === NoteFormat.BOTH) {
        // Convert to combined format that preserves both types
        newNotes = toCombinedNotes(notes);
      } else if (format === NoteFormat.LIST) {
        if (notes.format === NoteFormat.BOTH) {
          // Keep list items from combined notes
          newNotes = {
            format: NoteFormat.LIST,
            items: (notes as CombinedNotes).items
          };
        } else {
          // Create new list and lose text content
          newNotes = createEmptyListNotes();
        }
      } else {
        // Switching to text format
        if (notes.format === NoteFormat.BOTH) {
          // Keep text content from combined notes
          newNotes = {
            format: NoteFormat.TEXT,
            content: (notes as CombinedNotes).content
          };
        } else {
          // Create new text and lose list content
          newNotes = createEmptyTextNotes();
        }
      }
    }
    
    setNotes(newNotes);
    onChange(stringifyNotes(newNotes));
  };

  // Handle changes to text notes
  const handleTextChange = (text: string) => {
    if (notes.format === NoteFormat.BOTH) {
      // Update text content while preserving list items
      const updatedNotes: CombinedNotes = {
        format: NoteFormat.BOTH,
        content: text,
        items: (notes as CombinedNotes).items
      };
      setNotes(updatedNotes);
      onChange(stringifyNotes(updatedNotes));
    } else {
      // Standard text note update
      const updatedNotes: TextNotes = {
        format: NoteFormat.TEXT,
        content: text
      };
      setNotes(updatedNotes);
      onChange(stringifyNotes(updatedNotes));
    }
  };

  // Handle changes to list notes
  const handleListChange = (listNotes: ListNotes) => {
    if (notes.format === NoteFormat.BOTH) {
      // Update list items while preserving text content
      const updatedNotes: CombinedNotes = {
        format: NoteFormat.BOTH,
        content: (notes as CombinedNotes).content,
        items: listNotes.items
      };
      setNotes(updatedNotes);
      onChange(stringifyNotes(updatedNotes));
    } else {
      // Standard list note update
      setNotes(listNotes);
      onChange(stringifyNotes(listNotes));
    }
  };

  return (
    <div className={`notes-editor ${className}`}>
      {/* Header with format switcher */}
      <div className="flex items-center justify-between mb-2 border-b pb-2">
        <div className="flex items-center">
          <h3 className="text-sm font-medium text-gray-700 mr-2">
            {notes.format === NoteFormat.LIST ? 'Checklist' : 
             notes.format === NoteFormat.TEXT ? 'Notes' : 
             'Notes & Checklist'}
          </h3>
          
          {!readOnly && (
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={() => switchFormat(NoteFormat.LIST)}
                className={`p-1 rounded-md ${
                  notes.format === NoteFormat.LIST 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Checklist format"
              >
                <ListChecks className="w-4 h-4" />
              </button>
              
              <button
                type="button"
                onClick={() => switchFormat(NoteFormat.TEXT)}
                className={`p-1 rounded-md ${
                  notes.format === NoteFormat.TEXT 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Text format"
              >
                <FileText className="w-4 h-4" />
              </button>
              
              <button
                type="button"
                onClick={() => switchFormat(NoteFormat.BOTH)}
                className={`p-1 rounded-md ${
                  notes.format === NoteFormat.BOTH 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Combined format (notes & checklist)"
              >
                <Layers className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Text editor section */}
      {(notes.format === NoteFormat.TEXT || notes.format === NoteFormat.BOTH) && (
        <div className="mb-4">
          {notes.format === NoteFormat.BOTH && (
            <h4 className="text-xs font-medium text-gray-500 mb-1">Text Notes</h4>
          )}
          <textarea
            placeholder="Enter your notes here..."
            value={notes.format === NoteFormat.TEXT ? (notes as TextNotes).content : (notes as CombinedNotes).content}
            onChange={(e) => handleTextChange(e.target.value)}
            readOnly={readOnly}
            className="w-full p-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            rows={4}
          />
        </div>
      )}
      
      {/* List editor section */}
      {(notes.format === NoteFormat.LIST || notes.format === NoteFormat.BOTH) && (
        <div>
          {notes.format === NoteFormat.BOTH && (
            <h4 className="text-xs font-medium text-gray-500 mb-1">Checklist Items</h4>
          )}
          <ListEditor
            value={notes.format === NoteFormat.LIST ? notes as ListNotes : 
                   { format: NoteFormat.LIST, items: (notes as CombinedNotes).items }}
            onChange={handleListChange}
            readOnly={readOnly}
          />
        </div>
      )}
    </div>
  );
};

export default NotesEditor;
