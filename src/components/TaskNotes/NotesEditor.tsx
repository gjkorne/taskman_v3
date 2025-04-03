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
      {/* Header with format switcher */}
      <div className="flex items-center justify-between mb-2 border-b pb-2">
        <div className="flex items-center">
          <h3 className="text-sm font-medium text-gray-700 mr-2">
            {notes.format === NoteFormat.LIST ? 'Checklist' : 'Notes'}
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
                aria-label="Switch to list format"
                title="Checklist"
              >
                <ListChecks size={14} />
              </button>
              <button
                type="button"
                onClick={() => switchFormat(NoteFormat.TEXT)}
                className={`p-1 rounded-md ${
                  notes.format === NoteFormat.TEXT 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-label="Switch to text format"
                title="Text Notes"
              >
                <FileText size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Render the appropriate editor based on the note format */}
      {notes.format === NoteFormat.TEXT ? (
        <textarea
          value={(notes as TextNotes).content}
          onChange={(e) => handleTextChange(e.target.value)}
          readOnly={readOnly}
          className="w-full border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-400 resize-none h-32 p-3 text-gray-700 placeholder-gray-400 focus:outline-none"
          placeholder="Add notes here..."
        />
      ) : (
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <ListEditor
            value={notes as ListNotes}
            onChange={handleListChange}
            readOnly={readOnly}
            className="p-2"
          />
        </div>
      )}
    </div>
  );
};

export default NotesEditor;
