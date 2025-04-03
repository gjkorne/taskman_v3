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
import { ListChecks, FileText, ChevronDown, ChevronUp } from 'lucide-react';

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
  // State to track if checklist is expanded or collapsed
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(false);

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

  // Toggle checklist expansion
  const toggleChecklistExpansion = () => {
    setIsChecklistExpanded(!isChecklistExpanded);
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
      
      {/* Render the appropriate editor based on the note format */}
      {notes.format === NoteFormat.TEXT ? (
        <textarea
          value={(notes as TextNotes).content}
          onChange={(e) => handleTextChange(e.target.value)}
          readOnly={readOnly}
          className="w-full border-0 focus:ring-0 resize-none h-32 p-3 text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
          placeholder="Add notes here..."
        />
      ) : (
        <div>
          {/* Checklist header with collapse/expand button */}
          {notes.format === NoteFormat.LIST && !readOnly && (
            <div className="flex items-center justify-between border-b px-3 py-2 bg-gray-50">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <ListChecks size={16} />
                Checklist
              </span>
              <button
                type="button"
                onClick={toggleChecklistExpansion}
                className="text-gray-500 hover:text-gray-700 p-1 rounded"
                title={isChecklistExpanded ? "Collapse checklist" : "Expand checklist"}
              >
                {isChecklistExpanded ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>
            </div>
          )}
          
          {/* Conditionally render the ListEditor based on expansion state */}
          <div className={!isChecklistExpanded && !readOnly ? 'hidden' : ''}>
            <ListEditor
              value={notes as ListNotes}
              onChange={handleListChange}
              readOnly={readOnly}
              className="p-2"
            />
          </div>
          
          {/* Show a preview when collapsed */}
          {!isChecklistExpanded && !readOnly && (notes as ListNotes).items.length > 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              {(notes as ListNotes).items.length} item{(notes as ListNotes).items.length !== 1 ? 's' : ''} in checklist
              {(notes as ListNotes).items.some(item => item.completed) && (
                <span> • {(notes as ListNotes).items.filter(item => item.completed).length} completed</span>
              )}
            </div>
          )}
          
          {/* Empty state message when checklist is empty */}
          {!readOnly && !isChecklistExpanded && (notes as ListNotes).items.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-400 italic">
              Click to expand and add checklist items
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotesEditor;
