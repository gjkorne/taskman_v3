import { useState } from 'react';
import { PieChart as PieChartIcon, List } from 'lucide-react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface TaskCompletionItem {
  id: string;
  label: string;
  value: number; // completion percentage
  formattedValue: string;
  totalTasks: number;
  completedTasks: number;
}

interface TaskCompletionViewProps {
  data: TaskCompletionItem[];
  isLoading?: boolean;
}

export function TaskCompletionView({
  data,
  isLoading = false,
}: TaskCompletionViewProps) {
  const [viewType, setViewType] = useState<'pie' | 'table'>('pie');

  // Calculate overall completion rate
  const totalTasks = data.reduce((sum, item) => sum + item.totalTasks, 0);
  const completedTasks = data.reduce(
    (sum, item) => sum + item.completedTasks,
    0
  );
  const overallCompletionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
          No task data available for the selected period.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Try changing your filters or adding more tasks.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Task Completion Rate</h2>
        <div className="flex space-x-1 border rounded-md overflow-hidden">
          <button
            onClick={() => setViewType('pie')}
            className={`p-2 ${
              viewType === 'pie'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-white text-gray-700'
            }`}
            title="Pie Chart"
          >
            <PieChartIcon size={18} />
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
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium text-gray-700">
            Overall Completion Rate
          </h3>
          <div className="flex justify-center items-center my-3">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="3"
                  strokeDasharray="100, 100"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="3"
                  strokeDasharray={`${overallCompletionRate}, 100`}
                />
                <text
                  x="18"
                  y="21"
                  textAnchor="middle"
                  fontSize="10"
                  fill="#4F46E5"
                  fontWeight="bold"
                >
                  {overallCompletionRate}%
                </text>
              </svg>
            </div>
          </div>
          <div className="text-gray-500 text-sm">
            {completedTasks} of {totalTasks} tasks completed
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
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Completion Rate
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Completed / Total
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
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                          <div
                            className="bg-indigo-600 h-2.5 rounded-full"
                            style={{ width: `${item.value}%` }}
                          ></div>
                        </div>
                        <span>{item.formattedValue}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.completedTasks} / {item.totalTasks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="h-64">
              <TaskCompletionPieChart data={data} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              {data.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 text-left">
                  <h3
                    className="font-medium text-gray-800 truncate"
                    title={item.label}
                  >
                    {item.label}
                  </h3>
                  <div className="mt-2">
                    <div className="text-sm text-gray-500 mb-1">
                      {item.completedTasks} of {item.totalTasks} tasks
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-indigo-600 h-2.5 rounded-full"
                        style={{ width: `${item.value}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-lg font-bold text-indigo-600">
                      {item.formattedValue}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Pie chart component for task completion data
function TaskCompletionPieChart({ data }: { data: TaskCompletionItem[] }) {
  // Sort data by completion rate (ascending) for better visualization
  const sortedData = [...data].sort((a, b) => a.value - b.value);

  const chartConfig = {
    labels: sortedData.map((item) => item.label),
    datasets: [
      {
        data: sortedData.map((item) => item.value), // Completion percentage
        backgroundColor: [
          'rgba(16, 185, 129, 0.7)', // Green/Emerald (for high completion)
          'rgba(99, 102, 241, 0.7)', // Indigo
          'rgba(6, 182, 212, 0.7)', // Cyan
          'rgba(132, 204, 22, 0.7)', // Lime
          'rgba(245, 158, 11, 0.7)', // Amber
          'rgba(249, 115, 22, 0.7)', // Orange
          'rgba(239, 68, 68, 0.7)', // Red (for low completion)
          'rgba(236, 72, 153, 0.7)', // Pink
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(99, 102, 241, 1)',
          'rgba(6, 182, 212, 1)',
          'rgba(132, 204, 22, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(236, 72, 153, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const item = sortedData[context.dataIndex];
            return `${item.label}: ${item.formattedValue} (${item.completedTasks}/${item.totalTasks})`;
          },
        },
      },
    },
  };

  return <Pie data={chartConfig} options={options} />;
}
