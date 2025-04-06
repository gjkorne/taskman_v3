import { render, screen, fireEvent } from '@testing-library/react';
import { Table } from '../Table';
import { DensityProvider } from '../../../contexts/ui/DensityContext';

// Mock data and columns for testing
type TestData = {
  id: number;
  name: string;
  status: string;
};

const testData: TestData[] = [
  { id: 1, name: 'Item 1', status: 'Active' },
  { id: 2, name: 'Item 2', status: 'Inactive' },
  { id: 3, name: 'Item 3', status: 'Pending' },
];

const testColumns = [
  { header: 'ID', accessor: 'id' as const, align: 'center' as const, width: 80 },
  { header: 'Name', accessor: 'name' as const },
  { header: 'Status', accessor: (row: TestData) => row.status === 'Active' ? <span className="text-green-500">{row.status}</span> : row.status },
];

// Mock component wrapper with DensityProvider
const renderWithDensity = (ui: React.ReactElement) => {
  return render(
    <DensityProvider>
      {ui}
    </DensityProvider>
  );
};

describe('Table Component', () => {
  it('renders table with correct data', () => {
    renderWithDensity(
      <Table<TestData> 
        data={testData} 
        columns={testColumns} 
      />
    );
    
    // Check if all data is rendered
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });
  
  it('renders empty message when no data is provided', () => {
    renderWithDensity(
      <Table<TestData> 
        data={[]} 
        columns={testColumns}
        emptyMessage="No items found"
      />
    );
    
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });
  
  it('calls onRowClick when row is clicked', () => {
    const handleRowClick = jest.fn();
    
    renderWithDensity(
      <Table<TestData> 
        data={testData} 
        columns={testColumns}
        onRowClick={handleRowClick}
      />
    );
    
    // Click the first row
    fireEvent.click(screen.getByText('Item 1'));
    
    expect(handleRowClick).toHaveBeenCalledWith(testData[0], 0);
  });
  
  it('applies zebra striping to rows when zebra is true', () => {
    renderWithDensity(
      <Table<TestData> 
        data={testData} 
        columns={testColumns}
        zebra={true}
      />
    );
    
    const rows = screen.getAllByRole('row').slice(1); // Skip header row
    
    // First row should not have the zebra class
    expect(rows[0]).not.toHaveClass('bg-gray-50');
    
    // Second row should have the zebra class
    expect(rows[1]).toHaveClass('bg-gray-50');
  });
  
  it('applies bordered style when bordered is true', () => {
    renderWithDensity(
      <Table<TestData> 
        data={testData} 
        columns={testColumns}
        bordered={true}
      />
    );
    
    const table = screen.getByRole('table');
    expect(table).toHaveClass('border');
    expect(table).toHaveClass('border-gray-200');
  });
  
  it('renders loading skeleton when isLoading is true', () => {
    renderWithDensity(
      <Table<TestData> 
        data={testData} 
        columns={testColumns}
        isLoading={true}
        loadingRows={3}
      />
    );
    
    // Check for loading state indicators (skeletons)
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(3); // 3 loading rows
  });
  
  it('uses custom rowKey function when provided', () => {
    renderWithDensity(
      <Table<TestData> 
        data={testData} 
        columns={testColumns}
        rowKey={(row) => `custom-key-${row.id}`}
      />
    );
    
    const rows = screen.getAllByRole('row').slice(1); // Skip header row
    expect(rows[0].getAttribute('key')).toBe('custom-key-1');
  });
});
