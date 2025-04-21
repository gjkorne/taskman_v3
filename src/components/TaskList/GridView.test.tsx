import { render, screen } from '@testing-library/react';
import { GridView } from './GridView';
import type { Task } from '../../types/task';

// Mock TaskCard to simplify GridView output
vi.mock('./TaskCard', () => ({
  TaskCard: ({ task }: { task: Task }) => <div data-testid="task-card">{task.id}</div>,
}));

describe('GridView', () => {
  const tasks: Task[] = [
    {
      id: '1',
      title: 'Task 1',
      description: '',
      status: 'pending',
      priority: 'low',
      due_date: null,
      estimated_time: null,
      actual_time: null,
      tags: [],
      created_at: '',
      updated_at: null,
      created_by: null,
      is_deleted: false,
      list_id: null,
      nlp_tokens: null,
      extracted_entities: null,
      embedding_data: null,
      confidence_score: null,
      processing_metadata: null,
      category_name: null,
    },
    {
      id: '2',
      title: 'Task 2',
      description: '',
      status: 'pending',
      priority: 'low',
      due_date: null,
      estimated_time: null,
      actual_time: null,
      tags: [],
      created_at: '',
      updated_at: null,
      created_by: null,
      is_deleted: false,
      list_id: null,
      nlp_tokens: null,
      extracted_entities: null,
      embedding_data: null,
      confidence_score: null,
      processing_metadata: null,
      category_name: null,
    },
  ];

  it('renders correct number of task cards', () => {
    render(<GridView tasks={tasks} />);
    expect(screen.getAllByTestId('task-card')).toHaveLength(2);
  });
});
