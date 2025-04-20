import { useState } from 'react';
import { BarChart as BarChartIcon, List } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ProductivityReportItem {
  id: string;
  label: string;
  value: number;
  formattedValue: string;
}

interface ProductivityViewProps {
  data: ProductivityReportItem[];
  isLoading?: boolean;
}

export function ProductivityView({
  data,
  isLoading = false,
}: ProductivityViewProps) {
  const [viewType, setViewType] = useState<'bar' | 'table'>('bar');

  // Calculate total tasks completed
  const totalTasks = data.reduce((total, item) => total + item.value, 0);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-lg text-gray-500">
          No productivity data available for the selected period.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Try changing your filters or complete some tasks first.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Productivity Metrics</h2>
        <div className="flex space-x-1 border rounded-md overflow-hidden">
          <button
            onClick={() => setViewType('bar')}
            className={`p-2 ${
              viewType === 'bar'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-white text-gray-700'
            }`}
            title="Bar Chart"
          >
            <BarChartIcon size={18} />
          </button>
          <button
            onClick={() => setViewType('table')}
            className={`p-2 ${
              viewType === 'table'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-white text-gray-700'
            }`}
            title="Table View"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      <div className="bg-white p-4 border rounded-lg mb-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-medium text-gray-700">
            Total Tasks Completed
          </h3>
          <div className="text-3xl font-bold text-indigo-600">{totalTasks}</div>
          <div className="text-gray-500 text-sm">
            {data.length > 0 &&
              `Over ${data.length} ${data.length === 1 ? 'day' : 'days'}`}
          </div>
        </div>

        {viewType === 'table' ? (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Tasks Completed
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.label}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="h-64">
              <ProductivityBarChart data={data} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              {data.slice(0, 6).map((item) => (
                <div key={item.id} className="border rounded-lg p-4 text-left">
                  <h3
                    className="font-medium text-gray-800 truncate"
                    title={item.label}
                  >
                    {item.label}
                  </h3>
                  <div className="mt-2 flex justify-between items-end">
                    <span className="text-2xl font-bold text-indigo-600">
                      {item.value}
                    </span>
                    <span className="text-gray-500">Tasks</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full"
                      style={{
                        width: `${Math.min(
                          (item.value /
                            (Math.max(...data.map((d) => d.value)) || 1)) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {data.length > 6 && (
              <div className="mt-4 text-sm text-gray-500">
                <p>+ {data.length - 6} more days</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Bar chart component for productivity data
function ProductivityBarChart({ data }: { data: ProductivityReportItem[] }) {
  const chartConfig = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        label: 'Tasks Completed',
        data: data.map((item) => item.value),
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.parsed.y} tasks completed`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0, // Only show integer values
        },
      },
    },
  };

  return <Bar data={chartConfig} options={options} />;
}
