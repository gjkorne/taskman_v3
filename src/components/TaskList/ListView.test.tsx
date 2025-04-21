import { render, screen } from '@testing-library/react';
import { ListView } from './ListView';
import type { Task } from '../../types/task';

// Mock TaskSection to simplify ListView output
vi.mock('./TaskSection', () => ({
  TaskSection: ({ customTitle }: { customTitle: string }) => <div data-testid="section">{customTitle}</div>,
}));

describe('ListView', () => {
  const tasks: Task[] = [
    { id: '1', title: 'A', description: '', status: 'pending', priority: 'low', due_date: null, estimated_time: null, actual_time: null, tags: [], created_at: '', updated_at: null, created_by: null, is_deleted: false, list_id: null, nlp_tokens: null, extracted_entities: null, embedding_data: null, confidence_score: null, processing_metadata: null, category_name: 'X' },
    { id: '2', title: 'B', description: '', status: 'pending', priority: 'low', due_date: null, estimated_time: null, actual_time: null, tags: [], created_at: '', updated_at: null, created_by: null, is_deleted: false, list_id: null, nlp_tokens: null, extracted_entities: null, embedding_data: null, confidence_score: null, processing_metadata: null, category_name: 'Y' },
    { id: '3', title: 'C', description: '', status: 'pending', priority: 'low', due_date: null, estimated_time: null, actual_time: null, tags: [], created_at: '', updated_at: null, created_by: null, is_deleted: false, list_id: null, nlp_tokens: null, extracted_entities: null, embedding_data: null, confidence_score: null, processing_metadata: null, category_name: 'X' },
  ];

  it('renders sections grouped by category', () => {
    render(<ListView tasks={tasks} />);
    // Expect one section per unique category
    expect(screen.getAllByTestId('section')).toHaveLength(2);
    // Titles should match categories
    expect(screen.getByText('X')).toBeInTheDocument();
    expect(screen.getByText('Y')).toBeInTheDocument();
  });
});
