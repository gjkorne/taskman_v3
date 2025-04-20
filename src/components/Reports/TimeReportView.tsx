import { useState } from 'react';
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  List,
} from 'lucide-react';
import { TimeReportItem } from '../../services/api/reportsService';
import { formatDurationHumanReadable } from '../../utils/timeUtils';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface TimeReportViewProps {
  data: TimeReportItem[];
  isLoading?: boolean;
}

export function TimeReportView({
  data,
  isLoading = false,
}: TimeReportViewProps) {
  const [viewType, setViewType] = useState<'bar' | 'pie' | 'table'>('bar');

  // Calculate total time across all items
  const totalTimeSeconds = data.reduce((total, item) => total + item.value, 0);
  const formattedTotalTime = formatDurationHumanReadable(totalTimeSeconds);

  console.log('Time report data in component:', data);
  console.log(
    'Total time seconds:',
    totalTimeSeconds,
    'formatted as:',
    formattedTotalTime
  );

  // Calculate percentages for each item
  const dataWithPercentages = data.map((item) => ({
    ...item,
    percentage:
      totalTimeSeconds > 0 ? (item.value / totalTimeSeconds) * 100 : 0,
  }));

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
          No time data available for the selected period.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Try changing your filters or logging some time sessions.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold mb-6">Time Distribution</h2>
        <div className="text-right mb-4">
          <div className="text-gray-600">Total Time</div>
          <div className="text-3xl font-bold text-indigo-600">
            {formattedTotalTime}
          </div>
        </div>
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
        {viewType === 'table' ? (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Time
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Percentage
                  </th>
                  {data[0]?.count !== undefined && (
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Sessions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dataWithPercentages.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.label}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.formattedValue}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.percentage.toFixed(1)}%
                    </td>
                    {item.count !== undefined && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.count}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            {viewType === 'bar' ? (
              <BarChart data={dataWithPercentages} />
            ) : (
              <PieChart data={dataWithPercentages} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper components for charts
function BarChart({
  data,
}: {
  data: Array<TimeReportItem & { percentage: number }>;
}) {
  // Only show top 10 items for readability
  const chartData = data.slice(0, 10);

  const chartConfig = {
    labels: chartData.map((item) => item.label),
    datasets: [
      {
        label: 'Time Spent (hours)',
        data: chartData.map((item) => +(item.value / 3600).toFixed(2)), // Convert seconds to hours
        backgroundColor: generateColors(chartData.length),
        borderColor: 'rgba(99, 102, 241, 0.8)',
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
            return `${context.parsed.y} hours (${
              chartData[context.dataIndex].formattedValue
            })`;
          },
        },
      },
    },
  };

  return <Bar data={chartConfig} options={options} />;
}

function PieChart({
  data,
}: {
  data: Array<TimeReportItem & { percentage: number }>;
}) {
  // Only show top 8 items for pie chart readability
  const visibleData = data.slice(0, 8);

  // If there are more items, create an "Other" category
  let hasOther = false;
  let otherValue = 0;

  if (data.length > 8) {
    hasOther = true;
    otherValue = data.slice(8).reduce((sum, item) => sum + item.value, 0);
  }

  const chartData = {
    labels: [
      ...visibleData.map((item) => item.label),
      ...(hasOther ? ['Other'] : []),
    ],
    datasets: [
      {
        data: [
          ...visibleData.map((item) => +(item.value / 3600).toFixed(2)), // Convert seconds to hours
          ...(hasOther ? [+(otherValue / 3600).toFixed(2)] : []),
        ],
        backgroundColor: generateColors(
          visibleData.length + (hasOther ? 1 : 0)
        ),
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
            const index = context.dataIndex;
            const value = context.parsed;

            // For the "Other" category
            if (hasOther && index === visibleData.length) {
              return `Other: ${value} hours`;
            }

            // For regular items
            return `${context.label}: ${value} hours (${visibleData[index].formattedValue})`;
          },
        },
      },
    },
  };

  return <Pie data={chartData} options={options} />;
}

// Helper function to generate colors
function generateColors(count: number): string[] {
  const baseColors = [
    'rgba(99, 102, 241, 0.8)', // Indigo
    'rgba(79, 70, 229, 0.8)', // Purple
    'rgba(16, 185, 129, 0.8)', // Emerald
    'rgba(245, 158, 11, 0.8)', // Amber
    'rgba(239, 68, 68, 0.8)', // Red
    'rgba(6, 182, 212, 0.8)', // Cyan
    'rgba(132, 204, 22, 0.8)', // Lime
    'rgba(249, 115, 22, 0.8)', // Orange
    'rgba(236, 72, 153, 0.8)', // Pink
    'rgba(59, 130, 246, 0.8)', // Blue
  ];

  // If we need more colors than we have, generate them
  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }

  // For additional colors, we'll generate with varying opacities
  const result = [...baseColors];

  for (let i = baseColors.length; i < count; i++) {
    const baseColor = baseColors[i % baseColors.length];
    const opacity = 0.9 - (i - baseColors.length) * 0.1;
    result.push(baseColor.replace(/[\d.]+\)$/, `${opacity})`));
  }

  return result;
}
