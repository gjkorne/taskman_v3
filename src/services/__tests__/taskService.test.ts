/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskService } from '../taskService';
import { taskRepository } from '../../repositories/taskRepository';
import type { Task } from '../../types/task';
import { supabase } from '../../lib/supabase';

// Mock the repository methods
vi.mock('../../repositories/taskRepository', () => ({
  taskRepository: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('TaskService', () => {
  let service: TaskService;
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Test Task',
      description: 'Test',
      status: 'pending',
      priority: 'low',
      due_date: null,
      estimated_time: null,
      actual_time: null,
      tags: [],
      created_at: '2025-04-20T00:00:00Z',
      updated_at: null,
      created_by: 'user1',
      is_deleted: false,
      is_starred: false,
      list_id: null,
      category_name: null,
      checklist_items: null,
      notes: null,
      note_type: null,
      nlp_tokens: null,
      extracted_entities: null,
      embedding_data: null,
      confidence_score: null,
      processing_metadata: null,
      rawInput: undefined,
      _is_synced: undefined,
      _sync_status: undefined,
      _conflict_resolution: null,
      _local_updated_at: undefined,
      _sync_error: undefined,
    },
  ];

  beforeEach(() => {
    service = new TaskService();
    (taskRepository.getAll as any).mockReset();
    (taskRepository.getById as any).mockReset();
  });

  it('getTasks should return tasks on success', async () => {
    (taskRepository.getAll as any).mockResolvedValue(mockTasks);
    const tasks = await service.getTasks();
    expect(tasks).toEqual(mockTasks);
  });

  it('getTasks should return [] on error', async () => {
    (taskRepository.getAll as any).mockRejectedValue(new Error('fail'));
    const tasks = await service.getTasks();
    expect(tasks).toEqual([]);
  });

  it('getTaskById should return task on success', async () => {
    const mockTask = mockTasks[0];
    (taskRepository.getById as any).mockResolvedValue(mockTask);
    const task = await service.getTaskById('1');
    expect(task).toEqual(mockTask);
  });

  it('getTaskById should return null on error', async () => {
    (taskRepository.getById as any).mockRejectedValue(new Error('fail'));
    const task = await service.getTaskById('1');
    expect(task).toBeNull();
  });

  // Tests for createTask, updateTask, and deleteTask
  it('createTask should return task on success', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({ data: { session: { user: { id: 'user1' } as any } }, error: null } as any);
    const newTask: Task = { ...mockTasks[0], id: '2' };
    (taskRepository.create as any).mockResolvedValue(newTask);
    const result = await service.createTask({ title: 'New Task' } as any);
    expect(result).toEqual(newTask);
  });

  it('createTask should return null on error', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({ data: { session: { user: { id: 'user1' } as any } }, error: null } as any);
    (taskRepository.create as any).mockRejectedValue(new Error('fail'));
    const result = await service.createTask({ title: 'New Task' } as any);
    expect(result).toBeNull();
  });

  it('updateTask should return updated task on success', async () => {
    const updated: Task = { ...mockTasks[0], title: 'Updated' };
    (taskRepository.update as any).mockResolvedValue(updated);
    const result = await service.updateTask('1', { title: 'Updated' });
    expect(result).toEqual(updated);
  });

  it('updateTask should return null on error', async () => {
    (taskRepository.update as any).mockRejectedValue(new Error('fail'));
    const result = await service.updateTask('1', { title: 'Updated' });
    expect(result).toBeNull();
  });

  it('deleteTask should return true on success', async () => {
    (taskRepository.delete as any).mockResolvedValue(true);
    const result = await service.deleteTask('1');
    expect(result).toBe(true);
  });

  it('deleteTask should return false on error', async () => {
    (taskRepository.delete as any).mockRejectedValue(new Error('fail'));
    const result = await service.deleteTask('1');
    expect(result).toBe(false);
  });
});
