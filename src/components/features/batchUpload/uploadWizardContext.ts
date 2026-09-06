import { createContext, useContext } from 'react';
import type { GridApi } from 'ag-grid-community';
import type { NameSplitRule, PreviewRecord, UploadCourseInfo } from '../../../types';

export interface UploadWizardValue {
  step: number;
  file: File | null;
  paste: string;
  /** Filename, or "Pasted data", shown on later wizard steps. */
  sourceLabel: string;
  demoFile: string;
  courseInfo: UploadCourseInfo;
  nameSplitRule: NameSplitRule;
  preview: PreviewRecord[];

  setStep: (step: number) => void;
  setFile: (file: File | null) => void;
  setPaste: (text: string) => void;
  setDemoFile: (name: string) => void;
  setCourseInfo: (patch: Partial<UploadCourseInfo>) => void;
  setNameSplitRule: (rule: NameSplitRule) => void;
  setGridApi: (api: GridApi<PreviewRecord> | null) => void;

  runPreview: () => Promise<void>;
  confirmImport: () => Promise<void>;
  reset: () => void;
}

export const UploadWizardContext = createContext<UploadWizardValue | null>(null);

export const useUploadWizard = (): UploadWizardValue => {
  const value = useContext(UploadWizardContext);
  if (!value) throw new Error('useUploadWizard must be used inside BatchUploadWizard');
  return value;
};
