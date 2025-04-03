import React, { useState, useEffect } from 'react';
import { 
  ListNotes, 
  TextNotes, 
  Notes, 
  NoteFormat, 
  createEmptyListNotes, 
  createEmptyTextNotes,
  parseNotes, 
  stringifyNotes 
} from '../../types/list';
import ListEditor from './ListEditor';
import { ListChecks, FileText } from 'lucide-react';

interface NotesEditorProps {
  value: string | null;
  onChange: (notes: string) => void;
  readOnly?: boolean;
  className?: string;
}

/**
 * NotesEditor component
 * Displays either a text editor or list editor based on the note format
 */
export const NotesEditor: React.FC<NotesEditorProps> = ({
  value,
  onChange,
  readOnly = false,
  className = '',
}) => {
  // Parse the notes string into a structured Notes object
  const [notes, setNotes] = useState<Notes>(parseNotes(value));

  // Update internal state when props change
  useEffect(() => {
    setNotes(parseNotes(value));
  }, [value]);

  // Handle switching between note formats
  const switchFormat = (format: NoteFormat) => {
    if (format === notes.format) return;
    
    let newNotes: Notes;
    
    if (format === NoteFormat.LIST) {
      newNotes = createEmptyListNotes();
    } else {
      newNotes = createEmptyTextNotes();
    }
    
    setNotes(newNotes);
    onChange(stringifyNotes(newNotes));
  };

  // Handle changes to text notes
  const handleTextChange = (text: string) => {
    const updatedNotes: TextNotes = {
      format: NoteFormat.TEXT,
      content: text
    };
    
    setNotes(updatedNotes);
    onChange(stringifyNotes(updatedNotes));
  };

  // Handle changes to list notes
  const handleListChange = (listNotes: ListNotes) => {
    setNotes(listNotes);
    onChange(stringifyNotes(listNotes));
  };

  return (
    <div className={`notes-editor ${className}`}>
      {/* Format switcher (only shown in edit mode) */}
      {!readOnly && (
        <div className="flex justify-end mb-2 space-x-2">
          <button
            type="button"
            onClick={() => switchFormat(NoteFormat.TEXT)}
            className={`p-1.5 rounded-md ${
              notes.format === NoteFormat.TEXT 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-label="Switch to text format"
            title="Text Notes"
          >
            <FileText size={16} />
          </button>
          <button
            type="button"
            onClick={() => switchFormat(NoteFormat.LIST)}
            className={`p-1.5 rounded-md ${
              notes.format === NoteFormat.LIST 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-label="Switch to list format"
            title="Checklist"
          >
            <ListChecks size={16} />
          </button>
        </div>
      )}
      
      {/* Notes content */}
      {notes.format === NoteFormat.LIST ? (
        <ListEditor
          value={notes as ListNotes}
          onChange={handleListChange}
          readOnly={readOnly}
        />
      ) : (
        <textarea
          value={(notes as TextNotes).content}
          onChange={(e) => handleTextChange(e.target.value)}
          disabled={readOnly}
          placeholder="Add notes here..."
          className="w-full min-h-[120px] p-2 border border-gray-300 rounded-md"
          rows={5}
        />
      )}
    </div>
  );
};

export default NotesEditor;
