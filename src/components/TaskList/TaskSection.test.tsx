// React import not needed
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { TaskSection } from './TaskSection';
import { Task } from '../../types/task';

// Mock TaskCard to simplify testing
vi.mock('./TaskCard', () => ({
  TaskCard: ({ task }: { task: Task }) => <div data-testid="task-card">{task.title}</div>,
}));

describe('TaskSection', () => {
  const tasks = [
    { id: '1', title: 'Task 1' } as unknown as Task,
    { id: '2', title: 'Task 2' } as unknown as Task,
  ] as unknown as Task[];

  it('renders null when tasks array is empty', () => {
    const { container } = render(
      <TaskSection tasks={[]} sectionKey={'Work' as any} customTitle="Work" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders section header and tasks when tasks are provided', () => {
    render(
      <TaskSection tasks={tasks} sectionKey={'Work' as any} customTitle="Work" />
    );
    // Header displays title and count
    expect(screen.getByText('Work')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    // TaskCard mocked titles
    const cards = screen.getAllByTestId('task-card');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent('Task 1');
  });
});
