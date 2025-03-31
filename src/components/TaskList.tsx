import React from 'react';
import { TaskForm } from './TaskForm/TaskForm';

export function TaskList() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Tasks</h2>
        <TaskForm />
      </div>
    </div>
  );
}