import React from 'react';
import { NoteFormat, parseNotes } from '../../types/list';
import ListViewer from './ListViewer';
import { ListChecks, FileText } from 'lucide-react';

interface NotesViewerProps {
  value: string | null;
  maxLength?: number;
  maxListItems?: number;
  className?: string;
  showFormatIcon?: boolean;
}

/**
 * NotesViewer component
 * Displays task notes in either text or list format based on the note format
 */
export const NotesViewer: React.FC<NotesViewerProps> = ({
  value,
  maxLength = 150,
  maxListItems = 3,
  className = '',
  showFormatIcon = true,
}) => {
  // Parse the notes string into a structured Notes object
  const notes = parseNotes(value);
  
  // For empty notes, don't render anything
  if (
    (notes.format === NoteFormat.TEXT && !notes.content) ||
    (notes.format === NoteFormat.LIST && notes.items.length === 0)
  ) {
    return null;
  }

  return (
    <div className={`notes-viewer ${className}`}>
      {/* Format indicator */}
      {showFormatIcon && (
        <div className="flex items-center mb-1 text-gray-500">
          {notes.format === NoteFormat.LIST ? (
            <>
              <ListChecks size={14} className="mr-1" />
              <span className="text-xs">Checklist</span>
            </>
          ) : (
            <>
              <FileText size={14} className="mr-1" />
              <span className="text-xs">Notes</span>
            </>
          )}
        </div>
      )}
      
      {/* Notes content */}
      {notes.format === NoteFormat.LIST ? (
        <ListViewer
          notes={notes}
          maxItems={maxListItems}
          showCollapsed={true}
        />
      ) : (
        <div className="text-sm text-gray-700">
          {notes.content.length > maxLength ? (
            <>
              {notes.content.substring(0, maxLength)}
              <span className="text-gray-500">...</span>
            </>
          ) : (
            notes.content
          )}
        </div>
      )}
    </div>
  );
};

export default NotesViewer;
