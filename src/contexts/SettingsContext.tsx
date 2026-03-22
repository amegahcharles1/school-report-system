'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface AppSettings {
  id?: string;
  schoolName: string;
  schoolMotto: string;
  department: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  logoUrl: string;
  currentTermId: string;
  currentYearId: string;
  currentTerm?: { id: string; name: string; academicYear?: { name: string } } | null;

  // Reports
  nextTermDate: string;
  teacherRemark: string;
  headteacherRemark: string;
  reportFooterText: string;
  showAttendance: boolean;
  showNextTermDate: boolean;
  showPositions: boolean;
  showAverages: boolean;

  // Marks
  caWeight: number;
  examWeight: number;
  passingScore: number;

  // Layout
  reportTitle: string;
  headTeacherName: string;
  columnWidth: number;

  // Terminology
  test1Label: string;
  assignment1Label: string;
  test2Label: string;
  assignment2Label: string;
  examLabel: string;
  studentLabel: string;
  subjectLabel: string;
  caSubtotalLabel: string;
  caWeightLabel: string;
  examWeightLabel: string;
  finalTotalLabel: string;
  gradeLabel: string;
  remarksLabel: string;
  classTeacherLabel: string;
  headTeacherLabel: string;
  totalMarksLabel: string;
  averageLabel: string;
  positionLabel: string;
  classAverageLabel: string;
  highestScoreLabel: string;
  lowestScoreLabel: string;
  marksEntryLabel: string;
  sortInstructionLabel: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  schoolName: 'My School',
  schoolMotto: '',
  department: '',
  schoolAddress: '',
  schoolPhone: '',
  schoolEmail: '',
  logoUrl: '',
  currentTermId: '',
  currentYearId: '',
  currentTerm: null,
  nextTermDate: '',
  teacherRemark: '',
  headteacherRemark: '',
  reportFooterText: 'Wishing all students a fruitful stay...',
  showAttendance: true,
  showNextTermDate: true,
  showPositions: true,
  showAverages: true,
  caWeight: 40,
  examWeight: 60,
  passingScore: 50,
  reportTitle: 'STUDENT PROGRESS REPORT',
  headTeacherName: 'ADMINISTRATOR',
  columnWidth: 100,
  test1Label: 'Test 1',
  assignment1Label: 'Assign 1',
  test2Label: 'Test 2',
  assignment2Label: 'Assign 2',
  examLabel: 'Exam',
  studentLabel: 'Student Name',
  subjectLabel: 'Subject of Learning',
  caSubtotalLabel: 'CA Subtotal',
  caWeightLabel: 'CA',
  examWeightLabel: 'Exam',
  finalTotalLabel: 'Final Total',
  gradeLabel: 'Grade',
  remarksLabel: 'Remarks / Comment',
  classTeacherLabel: 'Class Teacher',
  headTeacherLabel: 'Head Teacher',
  totalMarksLabel: 'Total Marks',
  averageLabel: 'Average %',
  positionLabel: 'Class Position',
  classAverageLabel: 'Class Average',
  highestScoreLabel: 'Highest Score',
  lowestScoreLabel: 'Lowest Score',
  marksEntryLabel: 'Marks Entry',
  sortInstructionLabel: 'Click column to sort',
};

interface SettingsContextValue {
  settings: AppSettings;
  isLoading: boolean;
  refetch: () => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  refetch: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<AppSettings>({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) return DEFAULT_SETTINGS;
        const data = await res.json();
        if (data?.error) return DEFAULT_SETTINGS;
        return { ...DEFAULT_SETTINGS, ...data };
      } catch {
        return DEFAULT_SETTINGS;
      }
    },
    staleTime: 0,           // Always fresh — re-fetch on every mount/focus
    refetchOnWindowFocus: true,
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['settings'] });
  }, [queryClient]);

  const settings: AppSettings = data ?? DEFAULT_SETTINGS;

  return (
    <SettingsContext.Provider value={{ settings, isLoading, refetch }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
