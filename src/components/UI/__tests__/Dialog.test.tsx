import { render, screen, fireEvent } from '@testing-library/react';
import { Dialog } from '../Dialog';
import { DensityProvider } from '../../../contexts/ui/DensityContext';

// Mock createPortal to allow testing (required for Modal)
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

describe('Dialog Component', () => {
  const onCloseMock = jest.fn();
  const onConfirmMock = jest.fn();
  const onCancelMock = jest.fn();

  beforeEach(() => {
    onCloseMock.mockClear();
    onConfirmMock.mockClear();
    onCancelMock.mockClear();
  });

  it('renders nothing when isOpen is false', () => {
    renderWithDensity(
      <Dialog 
        isOpen={false} 
        onClose={onCloseMock}
        onConfirm={onConfirmMock}
        onCancel={onCancelMock}
      >
        <div data-testid="dialog-content">Dialog Content</div>
      </Dialog>
    );
    
    expect(screen.queryByTestId('dialog-content')).not.toBeInTheDocument();
  });
  
  it('renders content when isOpen is true', () => {
    renderWithDensity(
      <Dialog 
        isOpen={true} 
        onClose={onCloseMock}
        onConfirm={onConfirmMock}
        onCancel={onCancelMock}
      >
        <div data-testid="dialog-content">Dialog Content</div>
      </Dialog>
    );
    
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
  });
  
  it('renders confirm and cancel buttons when handlers are provided', () => {
    renderWithDensity(
      <Dialog 
        isOpen={true} 
        onClose={onCloseMock}
        onConfirm={onConfirmMock}
        onCancel={onCancelMock}
        confirmText="Yes"
        cancelText="No"
      >
        <div>Are you sure?</div>
      </Dialog>
    );
    
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });
  
  it('calls onConfirm and onClose when clicking confirm button', () => {
    renderWithDensity(
      <Dialog 
        isOpen={true} 
        onClose={onCloseMock}
        onConfirm={onConfirmMock}
        confirmText="Confirm"
      >
        <div>Confirm this action</div>
      </Dialog>
    );
    
    fireEvent.click(screen.getByText('Confirm'));
    
    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
  
  it('calls onCancel and onClose when clicking cancel button', () => {
    renderWithDensity(
      <Dialog 
        isOpen={true} 
        onClose={onCloseMock}
        onCancel={onCancelMock}
        cancelText="Cancel"
      >
        <div>Cancel this action</div>
      </Dialog>
    );
    
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(onCancelMock).toHaveBeenCalledTimes(1);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
  
  it('applies the correct variant styles', () => {
    renderWithDensity(
      <Dialog 
        isOpen={true} 
        onClose={onCloseMock}
        onConfirm={onConfirmMock}
        variant="danger"
        confirmText="Delete"
      >
        <div>Delete confirmation</div>
      </Dialog>
    );
    
    const confirmButton = screen.getByText('Delete');
    expect(confirmButton).toHaveClass('bg-red-500');
  });
  
  it('disables the confirm button when confirmDisabled is true', () => {
    renderWithDensity(
      <Dialog 
        isOpen={true} 
        onClose={onCloseMock}
        onConfirm={onConfirmMock}
        confirmDisabled={true}
        confirmText="Submit"
      >
        <div>Submit form</div>
      </Dialog>
    );
    
    const confirmButton = screen.getByText('Submit');
    expect(confirmButton).toBeDisabled();
    expect(confirmButton).toHaveClass('opacity-50');
  });
});
