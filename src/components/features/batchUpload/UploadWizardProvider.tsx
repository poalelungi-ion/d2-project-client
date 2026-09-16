import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { GridApi } from 'ag-grid-community';
import type {
  NameSplitRule,
  PreviewRecord,
  UploadCourseHandoff,
  UploadCourseInfo,
} from '../../../types';
import { notify } from '../../../stores';
import { useApiMutations } from '../../../hooks/useApi';
import { isTabularPaste } from '../../../utils/tabularPaste';
import { UploadWizardContext } from './uploadWizardContext';
import type { UploadWizardValue } from './uploadWizardContext';

const UPLOAD_DEFAULTS = {
  ects: '6',
  attemptType: 'Exam 1',
  semester: 'WiSe 2024/25',
} as const;

interface UploadWizardProviderProps {
  /** The course this upload belongs to, handed over by a Course view's "Upload Exam Data" button. */
  course: UploadCourseHandoff;
  children: ReactNode;
}

export function UploadWizardProvider({ course, children }: UploadWizardProviderProps) {
  const { previewImport, confirmImport: sendImport } = useApiMutations();
  const [step, setStep] = useState(0);
  const [file, setFileState] = useState<File | null>(null);
  const [paste, setPasteState] = useState('');
  const [nameSplitRule, setNameSplitRule] = useState<NameSplitRule>('Last, First');
  const [preview, setPreview] = useState<PreviewRecord[]>([]);
  // In this system a course's id is its course number -- the catalogue form
  // labels the field "Course Number / ID" -- so the active course fills both.
  const [courseInfo, setCourseInfoState] = useState<UploadCourseInfo>(() => ({
    ...UPLOAD_DEFAULTS,
    courseId: course.id,
    courseNumber: String(course.id),
    courseName: course.name,
  }));

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

  const sourceLabel = file?.name ?? (paste.trim() ? 'Pasted data' : '');

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
      courseInfo,
      nameSplitRule,
      preview,
      setStep,
      setFile,
      setPaste,
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
