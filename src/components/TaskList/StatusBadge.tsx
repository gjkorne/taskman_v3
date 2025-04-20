import { Badge } from '../UI/Badge';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  // Format status for display (convert snake_case to Title Case)
  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Get variant based on status
  const getVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Badge variant={getVariant(status) as any} size="xs" rounded="full">
      {formatStatus(status)}
    </Badge>
  );
}
