import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { GridApi } from 'ag-grid-community';
import type { NameSplitRule, PreviewRecord, UploadCourseInfo } from '../../../types';
import { notify } from '../../../stores';
import { useApiMutations } from '../../../hooks/useApi';
import { isTabularPaste } from '../../../utils/tabularPaste';
import { UploadWizardContext } from './uploadWizardContext';
import type { UploadWizardValue } from './uploadWizardContext';

const DEFAULT_COURSE_INFO: UploadCourseInfo = {
  courseNumber: '3545',
  courseName: 'SE Tools Lab',
  ects: '6',
  attemptType: 'Exam 1',
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
  const [file, setFileState] = useState<File | null>(null);
  const [paste, setPasteState] = useState('');
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

  const setFile = useCallback((next: File | null) => {
    setFileState(next);
    if (next) setPasteState('');
  }, []);

  const setPaste = useCallback((text: string) => {
    setPasteState(text);
    if (text) setFileState(null);
  }, []);

  const sourceLabel = file?.name ?? (paste.trim() ? 'Pasted data' : demoFile);

  const setGridApi = useCallback((api: GridApi<PreviewRecord> | null) => {
    gridApiRef.current = api;
  }, []);

  const runPreview = useCallback(async () => {
    const trimmedPaste = paste.trim();
    let source: { file: File } | { paste: string };
    if (file) {
      source = { file };
    } else if (trimmedPaste) {
      if (!isTabularPaste(trimmedPaste)) {
        notify(
          'Pasted data is not tabular. Copy cells from a spreadsheet or paste CSV.',
          'error',
        );
        return;
      }
      source = { paste: trimmedPaste };
    } else {
      notify('Please select a file or paste tabular data first.', 'error');
      return;
    }
    const rows = await previewImport(source, courseInfo, nameSplitRule);
    if (rows) {
      setPreview(rows);
      setStep(3);
    }
  }, [file, paste, courseInfo, nameSplitRule, previewImport]);

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
    setFileState(null);
    setPasteState('');
    setPreview([]);
    gridApiRef.current = null;
  }, []);

  const value = useMemo<UploadWizardValue>(
    () => ({
      step,
      file,
      paste,
      sourceLabel,
      demoFile,
      courseInfo,
      nameSplitRule,
      preview,
      setStep,
      setFile,
      setPaste,
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
      paste,
      sourceLabel,
      demoFile,
      courseInfo,
      nameSplitRule,
      preview,
      setFile,
      setPaste,
      setCourseInfo,
      setGridApi,
      runPreview,
      confirmImport,
      reset,
    ],
  );

  return <UploadWizardContext.Provider value={value}>{children}</UploadWizardContext.Provider>;
}
