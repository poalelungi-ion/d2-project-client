import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { GridApi } from 'ag-grid-community';
import type { NameSplitRule, PreviewRecord, UploadCourseInfo } from '../../../types';
import { notify } from '../../../stores';
import { useApiMutations } from '../../../hooks/useApi';
import { UploadWizardContext } from './uploadWizardContext';
import type { UploadWizardValue } from './uploadWizardContext';

const DEFAULT_COURSE_INFO: UploadCourseInfo = {
  courseNumber: '3545',
  courseName: 'SE Tools Lab',
  ects: '6',
  examDate: '1st date',
  semester: 'WiSe 2024/25',
};

interface UploadWizardProviderProps {
  /** Seeds the course name when arriving from a course's "Upload Data" button. */
  initialCourseName?: string;
  children: ReactNode;
}

export function UploadWizardProvider({ initialCourseName, children }: UploadWizardProviderProps) {
  const { previewImport, confirmImport: sendImport } = useApiMutations();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [demoFile, setDemoFile] = useState('Klausur_DBS_WS2425.xlsx');
  const [nameSplitRule, setNameSplitRule] = useState<NameSplitRule>('Last, First');
  const [preview, setPreview] = useState<PreviewRecord[]>([]);
  const [courseInfo, setCourseInfoState] = useState<UploadCourseInfo>(() =>
    initialCourseName ? { ...DEFAULT_COURSE_INFO, courseName: initialCourseName } : DEFAULT_COURSE_INFO,
  );

  const gridApiRef = useRef<GridApi<PreviewRecord> | null>(null);

  const setCourseInfo = useCallback(
    (patch: Partial<UploadCourseInfo>) =>
      setCourseInfoState((current) => ({ ...current, ...patch })),
    [],
  );

  const setGridApi = useCallback((api: GridApi<PreviewRecord> | null) => {
    gridApiRef.current = api;
  }, []);

  const runPreview = useCallback(async () => {
    if (!file) {
      notify('Please select a file first.', 'error');
      return;
    }
    const rows = await previewImport(file, courseInfo, nameSplitRule);
    if (rows) {
      setPreview(rows);
      setStep(3);
    }
  }, [file, courseInfo, nameSplitRule, previewImport]);

  const confirmImport = useCallback(async () => {
    const api = gridApiRef.current;
    if (!api) return;

    const selectedRows = api.getSelectedRows();
    if (selectedRows.length === 0) {
      notify('No rows selected for import!', 'error');
      return;
    }
    if (await sendImport(courseInfo, selectedRows)) setStep(4);
  }, [courseInfo, sendImport]);

  const reset = useCallback(() => {
    setStep(0);
    setFile(null);
    setPreview([]);
    gridApiRef.current = null;
  }, []);

  const value = useMemo<UploadWizardValue>(
    () => ({
      step,
      file,
      demoFile,
      courseInfo,
      nameSplitRule,
      preview,
      setStep,
      setFile,
      setDemoFile,
      setCourseInfo,
      setNameSplitRule,
      setGridApi,
      runPreview,
      confirmImport,
      reset,
    }),
    [
      step,
      file,
      demoFile,
      courseInfo,
      nameSplitRule,
      preview,
      setCourseInfo,
      setGridApi,
      runPreview,
      confirmImport,
      reset,
    ],
  );

  return <UploadWizardContext.Provider value={value}>{children}</UploadWizardContext.Provider>;
}
