import React from 'react';
import { Badge } from './ui/Badge';

interface GradeBadgeProps {
  grade?: string;
  className?: string;
}

export function GradeBadge({ grade, className }: GradeBadgeProps) {
  if (!grade) return <Badge variant="secondary" className={className}>—</Badge>;

  const g = grade.toUpperCase();
  
  if (['A', 'A1', 'A+', '80', '90', '100'].some(v => g.includes(v))) {
    return <Badge variant="premium" className={className}>{grade}</Badge>;
  }
  
  if (['B', 'B2', 'B3', '70'].some(v => g.includes(v))) {
    return <Badge variant="success" className={className}>{grade}</Badge>;
  }
  
  if (['C', 'C4', 'C5', 'C6', '60'].some(v => g.includes(v))) {
    return <Badge variant="warning" className={className}>{grade}</Badge>;
  }

  if (['D', 'E', 'F', 'FAIL', '40', '30', '20', '10'].some(v => g.includes(v))) {
    return <Badge variant="danger" className={className}>{grade}</Badge>;
  }

  return <Badge variant="outline" className={className}>{grade}</Badge>;
}
