import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../Modal';
import { DensityProvider } from '../../../contexts/ui/DensityContext';

// Mock createPortal to allow testing
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

// Mock component wrapper with DensityProvider
const renderWithDensity = (ui: React.ReactElement) => {
  return render(
    <DensityProvider>
      {ui}
    </DensityProvider>
  );
};

describe('Modal Component', () => {
  const onCloseMock = jest.fn();

  beforeEach(() => {
    onCloseMock.mockClear();
  });

  it('renders nothing when isOpen is false', () => {
    renderWithDensity(
      <Modal isOpen={false} onClose={onCloseMock}>
        <div data-testid="modal-content">Modal Content</div>
      </Modal>
    );
    
    expect(screen.queryByTestId('modal-content')).not.toBeInTheDocument();
  });
  
  it('renders content when isOpen is true', () => {
    renderWithDensity(
      <Modal isOpen={true} onClose={onCloseMock}>
        <div data-testid="modal-content">Modal Content</div>
      </Modal>
    );
    
    expect(screen.getByTestId('modal-content')).toBeInTheDocument();
  });
  
  it('calls onClose when clicking the close button', () => {
    renderWithDensity(
      <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
        <div>Content</div>
      </Modal>
    );
    
    const closeButton = screen.getByLabelText('Close dialog');
    fireEvent.click(closeButton);
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
  
  it('calls onClose when clicking outside the modal if closeOnOutsideClick is true', () => {
    renderWithDensity(
      <Modal isOpen={true} onClose={onCloseMock} closeOnOutsideClick={true}>
        <div>Content</div>
      </Modal>
    );
    
    // Click the backdrop (parent element of the modal)
    const backdrop = screen.getByRole('dialog').parentElement;
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
  
  it('does not call onClose when clicking outside if closeOnOutsideClick is false', () => {
    renderWithDensity(
      <Modal isOpen={true} onClose={onCloseMock} closeOnOutsideClick={false}>
        <div>Content</div>
      </Modal>
    );
    
    // Click the backdrop (parent element of the modal)
    const backdrop = screen.getByRole('dialog').parentElement;
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    
    expect(onCloseMock).not.toHaveBeenCalled();
  });
  
  it('renders title when provided', () => {
    const title = 'Test Modal Title';
    renderWithDensity(
      <Modal isOpen={true} onClose={onCloseMock} title={title}>
        <div>Content</div>
      </Modal>
    );
    
    expect(screen.getByText(title)).toBeInTheDocument();
  });
  
  it('applies size classes correctly', () => {
    renderWithDensity(
      <Modal isOpen={true} onClose={onCloseMock} size="lg">
        <div>Content</div>
      </Modal>
    );
    
    const modalElement = screen.getByRole('dialog');
    expect(modalElement).toHaveClass('max-w-lg');
  });
});
