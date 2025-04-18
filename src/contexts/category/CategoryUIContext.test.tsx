import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CategoryUIProvider, useCategoryUI } from './CategoryUIContext';

function TestComponent() {
  const {
    isCategoryModalOpen,
    selectedCategoryId,
    showSubcategories,
    viewMode,
    openCategoryModal,
    closeCategoryModal,
    toggleSubcategoriesVisibility,
    setViewMode,
  } = useCategoryUI();

  return (
    <div>
      <span data-testid="modal">{isCategoryModalOpen ? 'open' : 'closed'}</span>
      <span data-testid="selected">{selectedCategoryId ?? 'none'}</span>
      <span data-testid="sub">{showSubcategories ? 'shown' : 'hidden'}</span>
      <span data-testid="view">{viewMode}</span>
      <button data-testid="open-none" onClick={() => openCategoryModal()} />
      <button data-testid="open-id" onClick={() => openCategoryModal('abc')} />
      <button data-testid="close" onClick={closeCategoryModal} />
      <button data-testid="toggle" onClick={toggleSubcategoriesVisibility} />
      <button data-testid="grid" onClick={() => setViewMode('grid')} />
      <button data-testid="list" onClick={() => setViewMode('list')} />
    </div>
  );
}

describe('CategoryUIContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('has correct default values', () => {
    render(
      <CategoryUIProvider>
        <TestComponent />
      </CategoryUIProvider>
    );
    expect(screen.getByTestId('modal')).toHaveTextContent('closed');
    expect(screen.getByTestId('selected')).toHaveTextContent('none');
    expect(screen.getByTestId('sub')).toHaveTextContent('shown');
    expect(screen.getByTestId('view')).toHaveTextContent('list');
  });

  it('opens modal without id', () => {
    render(
      <CategoryUIProvider>
        <TestComponent />
      </CategoryUIProvider>
    );
    fireEvent.click(screen.getByTestId('open-none'));
    expect(screen.getByTestId('modal')).toHaveTextContent('open');
    expect(screen.getByTestId('selected')).toHaveTextContent('none');
  });

  it('opens modal with id', () => {
    render(
      <CategoryUIProvider>
        <TestComponent />
      </CategoryUIProvider>
    );
    fireEvent.click(screen.getByTestId('open-id'));
    expect(screen.getByTestId('modal')).toHaveTextContent('open');
    expect(screen.getByTestId('selected')).toHaveTextContent('abc');
  });

  it('closes modal and clears selection after delay', () => {
    render(
      <CategoryUIProvider>
        <TestComponent />
      </CategoryUIProvider>
    );
    fireEvent.click(screen.getByTestId('open-id'));
    expect(screen.getByTestId('modal')).toHaveTextContent('open');
    fireEvent.click(screen.getByTestId('close'));
    expect(screen.getByTestId('modal')).toHaveTextContent('closed');
    // selection cleared after 300ms
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByTestId('selected')).toHaveTextContent('none');
  });

  it('toggles subcategories visibility', () => {
    render(
      <CategoryUIProvider>
        <TestComponent />
      </CategoryUIProvider>
    );
    fireEvent.click(screen.getByTestId('toggle'));
    expect(screen.getByTestId('sub')).toHaveTextContent('hidden');
    fireEvent.click(screen.getByTestId('toggle'));
    expect(screen.getByTestId('sub')).toHaveTextContent('shown');
  });

  it('sets view mode', () => {
    render(
      <CategoryUIProvider>
        <TestComponent />
      </CategoryUIProvider>
    );
    fireEvent.click(screen.getByTestId('grid'));
    expect(screen.getByTestId('view')).toHaveTextContent('grid');
    fireEvent.click(screen.getByTestId('list'));
    expect(screen.getByTestId('view')).toHaveTextContent('list');
  });
});
