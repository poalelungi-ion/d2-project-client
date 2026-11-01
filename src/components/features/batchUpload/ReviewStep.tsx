import { useCallback, useEffect, useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type {
  CellClassParams,
  CellValueChangedEvent,
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  IRowNode,
  RowClassParams,
  RowDataUpdatedEvent,
  ITooltipParams,
} from 'ag-grid-community';
import { Box, Typography, Button, Tooltip } from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

import type { PreviewRecord } from '../../../types';
import { useUploadWizard } from './uploadWizardContext';
import { useToastStore, useStudyProgramStore } from '../../../stores';
import { semantic, tint, gradeOutcomeColor } from '../../../styles/colors';
import { errorCallout, gridFrame } from '../../../styles/mixins';
import { layout } from '../../../styles/tokens';
import {
  GRADE_CONSTRAINT_MESSAGE,
  evaluateGradeCell,
  isOfficialAbsenceCell,
  outcomeLabel,
  parseGradeInput,
} from '../../../utils/gradeOutcome';
import {
  STUDY_PROGRAM_OPTIONS,
  formatValidationIssues,
  isAllowedStudyProgram,
  normalizeStudyProgram,
} from '../../../utils/studyProgram';
import { StudyProgramResolverDialog } from './StudyProgramResolverDialog';

export type EditablePreviewField =
  | 'student_id'
  | 'first_name'
  | 'last_name'
  | 'program'
  | 'semester'
  | 'grade';

const INVALID_TEXT_CHARS = /[<>{}[\]\\^~|]/;

/**
 * Evaluates a single cell in a preview row and returns a descriptive error
 * message when the cell contains missing or invalid data (#96056).
 */
export function getCellValidationError(
  row: PreviewRecord | undefined,
  field: EditablePreviewField,
  dynamicPrograms: readonly string[] = [],
): string | null {
  if (!row) return null;

  switch (field) {
    case 'student_id': {
      const val = String(row.student_id ?? '').trim();
      if (!val || row.missing_fields?.includes('Matrikelnummer')) {
        return 'Missing Matrikelnummer: Student ID is required.';
      }
      if (!/^\d+$/.test(val) || row.invalid_fields?.includes('Matrikelnummer')) {
        return 'Invalid Matrikelnummer: Student ID must contain only numeric digits.';
      }
      return null;
    }
    case 'first_name': {
      const val = String(row.first_name ?? '').trim();
      const combined = String(row.name ?? '').trim();
      if ((!val && !combined) || row.missing_fields?.includes('First Name')) {
        return 'Missing First Name: First name is required.';
      }
      if (INVALID_TEXT_CHARS.test(val)) {
        return 'Invalid First Name: Contains invalid characters.';
      }
      return null;
    }
    case 'last_name': {
      const val = String(row.last_name ?? '').trim();
      const combined = String(row.name ?? '').trim();
      if ((!val && !combined) || row.missing_fields?.includes('Last Name')) {
        return 'Missing Last Name: Last name is required.';
      }
      if (INVALID_TEXT_CHARS.test(val)) {
        return 'Invalid Last Name: Contains invalid characters.';
      }
      return null;
    }
    case 'program': {
      const val = String(row.program ?? '').trim();
      if (
        !isAllowedStudyProgram(val, dynamicPrograms) ||
        row.invalid_fields?.includes('Study Program')
      ) {
        return `Invalid Study Program "${val || 'Empty'}": Select or map to a valid study program.`;
      }
      return null;
    }
    case 'semester': {
      const val = String(row.semester ?? '').trim();
      if (!val || row.missing_fields?.includes('Semester')) {
        return 'Missing Semester: Semester is required.';
      }
      if (INVALID_TEXT_CHARS.test(val)) {
        return 'Invalid Semester: Contains invalid characters.';
      }
      return null;
    }
    case 'grade': {
      const val = String(row.grade ?? '').trim();
      if (!val) {
        return `Missing Grade: ${GRADE_CONSTRAINT_MESSAGE}`;
      }
      const parsed = parseGradeInput(val);
      if (!parsed.ok || row.missing_fields?.includes('Grade') || row.invalid_fields?.includes('Grade')) {
        return `Invalid Grade "${val}": ${GRADE_CONSTRAINT_MESSAGE}`;
      }
      return null;
    }
    default:
      return null;
  }
}

/**
 * Recomputes missing_fields, invalid_fields, outcome, and is_valid on a row
 * after a lecturer edits any cell directly in the preview grid (#96056).
 */
export function recomputePreviewRowValidation(
  row: PreviewRecord,
  dynamicPrograms: readonly string[] = [],
): PreviewRecord {
  const missing: string[] = [];
  const invalid: string[] = [];

  const studentId = String(row.student_id ?? '').trim();
  if (!studentId) {
    missing.push('Matrikelnummer');
  } else if (!/^\d+$/.test(studentId)) {
    invalid.push('Matrikelnummer');
  }

  const firstName = String(row.first_name ?? '').trim();
  const lastName = String(row.last_name ?? '').trim();
  const combinedName = String(row.name ?? '').trim();

  if (!firstName && !combinedName) {
    missing.push('First Name');
  } else if (INVALID_TEXT_CHARS.test(firstName)) {
    invalid.push('First Name');
  }

  if (!lastName && !combinedName) {
    missing.push('Last Name');
  } else if (INVALID_TEXT_CHARS.test(lastName)) {
    invalid.push('Last Name');
  }

  const normalizedProgram = normalizeStudyProgram(String(row.program ?? ''));
  row.program = normalizedProgram;
  if (!isAllowedStudyProgram(normalizedProgram, dynamicPrograms)) {
    invalid.push('Study Program');
  }

  const semester = String(row.semester ?? '').trim();
  if (!semester) {
    missing.push('Semester');
  } else if (INVALID_TEXT_CHARS.test(semester)) {
    invalid.push('Semester');
  }

  const gradeStr = String(row.grade ?? '').trim();
  const gradeVerdict = evaluateGradeCell(gradeStr);
  if (!gradeStr) {
    missing.push('Grade');
    row.outcome = 'invalid';
    row.absence_code = null;
  } else if (gradeVerdict.outcome === 'invalid') {
    invalid.push('Grade');
    row.outcome = 'invalid';
    row.absence_code = null;
  } else {
    row.outcome = gradeVerdict.outcome;
    row.absence_code = isOfficialAbsenceCell(gradeStr) ? gradeStr.toUpperCase() : null;
  }

  row.missing_fields = missing;
  row.invalid_fields = invalid;
  row.is_valid = missing.length === 0 && invalid.length === 0;
  return row;
}

export const ReviewStep = () => {
  const {
    preview: previewData,
    setGridApi: setWizardGridApi,
    setStep: setActiveStep,
    confirmImport,
  } = useUploadWizard();
  const [gridApi, setGridApi] = useState<GridApi<PreviewRecord> | null>(null);
  const notify = useToastStore((s) => s.notify);

  const [resolverOpen, setResolverOpen] = useState(false);
  const [dynamicPrograms, setDynamicPrograms] = useState<string[]>([]);
  const [, setValidationRevision] = useState(0);

  // Automatically normalize aliases and recompute cell-level validation on initial load
  useEffect(() => {
    let modified = false;
    for (const row of previewData) {
      const prevProgram = row.program;
      const prevValid = row.is_valid;
      recomputePreviewRowValidation(row, dynamicPrograms);
      if (row.program !== prevProgram || row.is_valid !== prevValid) {
        modified = true;
      }
    }
    if (modified) {
      setValidationRevision((r) => r + 1);
      if (gridApi) {
        gridApi.refreshCells({ force: true });
        gridApi.redrawRows();
      }
    }
  }, [previewData, dynamicPrograms, gridApi]);

  const unmappedPrograms = useMemo(() => {
    const set = new Set<string>();
    for (const r of previewData) {
      if (r.invalid_fields?.includes('Study Program') && r.program) {
        set.add(r.program);
      }
    }
    return Array.from(set);
  }, [previewData]);

  const availableProgramOptions = useMemo(() => {
    return Array.from(new Set([...STUDY_PROGRAM_OPTIONS, ...dynamicPrograms]));
  }, [dynamicPrograms]);

  const handleApplyMappings = (mappings: Record<string, string>, newPrograms: string[]) => {
    const updatedDynamics = Array.from(new Set([...dynamicPrograms, ...newPrograms]));
    setDynamicPrograms(updatedDynamics);

    const { addAlias } = useStudyProgramStore.getState();
    for (const [source, target] of Object.entries(mappings)) {
      addAlias(target, source);
    }

    for (const row of previewData) {
      if (mappings[row.program]) {
        row.program = mappings[row.program];
      }
      recomputePreviewRowValidation(row, updatedDynamics);
    }

    setValidationRevision((r) => r + 1);

    if (gridApi) {
      gridApi.refreshCells({ force: true });
      gridApi.redrawRows();
      gridApi.forEachNode((node: IRowNode<PreviewRecord>) => {
        if (node.data?.is_valid) {
          node.setSelected(true);
        }
      });
    }

    notify('Study programs successfully mapped and validated!');
  };

  const EditableValidatedCellRenderer = useCallback(
    (field: EditablePreviewField) =>
      function ValidatedCell(params: ICellRendererParams<PreviewRecord>) {
        const error = getCellValidationError(params.data, field, dynamicPrograms);
        const text = String(params.value ?? '');
        if (!error) {
          return <span>{text}</span>;
        }
        return (
          <Tooltip title={error} arrow placement="top">
            <span
              aria-label={error}
              data-testid={`invalid-cell-${field}`}
              style={{
                display: 'inline-block',
                width: '100%',
                color: semantic.error,
                fontWeight: 700,
              }}
            >
              {text || '—'}
            </span>
          </Tooltip>
        );
      },
    [dynamicPrograms],
  );

  const editableCellColumn = useCallback(
    (field: EditablePreviewField, colDef: ColDef<PreviewRecord>): ColDef<PreviewRecord> => ({
      ...colDef,
      field,
      editable: true,
      tooltipValueGetter: (params: ITooltipParams<PreviewRecord>) =>
        getCellValidationError(params.data, field, dynamicPrograms),
      cellStyle: (params: CellClassParams<PreviewRecord>) => {
        const error = getCellValidationError(params.data, field, dynamicPrograms);
        if (!error) return undefined;
        return {
          backgroundColor: 'rgba(211, 47, 47, 0.14)',
          color: semantic.error,
          border: `1.5px solid ${semantic.error}`,
          fontWeight: 700,
        };
      },
      cellRenderer: EditableValidatedCellRenderer(field),
    }),
    [dynamicPrograms, EditableValidatedCellRenderer],
  );

  const columnDefs = useMemo<ColDef<PreviewRecord>[]>(
    () => [
      {
        colId: 'rowNumber',
        headerName: '#',
        width: 64,
        minWidth: 56,
        maxWidth: 76,
        pinned: 'left',
        editable: false,
        sortable: false,
        filter: false,
        valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
        cellStyle: {
          color: '#64748b',
          fontWeight: 600,
          textAlign: 'center',
          backgroundColor: 'rgba(148, 163, 184, 0.08)',
        },
      },
      editableCellColumn('student_id', {
        headerName: 'Matrikelnr',
        checkboxSelection: true,
        headerCheckboxSelection: true,
        flex: 1.1,
        minWidth: 140,
      }),
      editableCellColumn('first_name', {
        headerName: 'First Name',
        flex: 1,
        minWidth: 110,
      }),
      editableCellColumn('last_name', {
        headerName: 'Last Name',
        flex: 1,
        minWidth: 110,
      }),
      editableCellColumn('program', {
        headerName: 'Study Program',
        flex: 1.4,
        minWidth: 180,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: availableProgramOptions },
      }),
      editableCellColumn('semester', {
        headerName: 'Semester',
        flex: 0.8,
        minWidth: 100,
      }),
      editableCellColumn('grade', {
        headerName: 'Grade',
        flex: 0.6,
        minWidth: 90,
      }),
      {
        colId: 'outcome',
        headerName: 'Result',
        flex: 0.8,
        minWidth: 100,
        editable: false,
        valueGetter: (params) => {
          const grade = params.data?.grade;
          if (grade != null && String(grade).length > 0) {
            return evaluateGradeCell(grade).outcome;
          }
          return params.data?.outcome ?? 'invalid';
        },
        cellRenderer: (params: ICellRendererParams<PreviewRecord, string>) => {
          const outcome = String(params.value ?? 'invalid');
          const absence =
            params.data && isOfficialAbsenceCell(params.data.grade)
              ? ` (${String(params.data.grade).toUpperCase()})`
              : '';
          return (
            <span style={{ color: gradeOutcomeColor(outcome), fontWeight: 'bold' }}>
              {outcomeLabel(outcome)}
              {absence}
            </span>
          );
        },
      },
      {
        colId: 'validationIssues',
        headerName: 'Validation Issues',
        flex: 2,
        minWidth: 240,
        editable: false,
        valueGetter: (params) =>
          formatValidationIssues(
            params.data?.missing_fields,
            params.data?.invalid_fields,
          ),
        cellRenderer: (params: ICellRendererParams<PreviewRecord, string | null>) => {
          if (!params.value)
            return (
              <span style={{ color: semantic.success, fontWeight: 'bold' }}>Valid</span>
            );
          return (
            <span style={{ color: semantic.error, fontWeight: 'bold' }}>
              {params.value}
            </span>
          );
        },
      },
    ],
    [availableProgramOptions, editableCellColumn],
  );

  const hasErrors = previewData.some((r) => {
    if (!r.is_valid) return true;
    const fields: EditablePreviewField[] = [
      'student_id',
      'first_name',
      'last_name',
      'program',
      'semester',
      'grade',
    ];
    return fields.some((f) => getCellValidationError(r, f, dynamicPrograms) !== null);
  });

  return (
    <Box sx={{ py: 2 }}>
      {resolverOpen && (
        <StudyProgramResolverDialog
          open={resolverOpen}
          onClose={() => setResolverOpen(false)}
          unmappedPrograms={unmappedPrograms}
          existingPrograms={availableProgramOptions}
          onApply={handleApplyMappings}
        />
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="700">
          Review Data &amp; Validation
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Pass and Fail are calculated from numeric grades (1.0–5.0). Status
          codes such as NE, EX, NA and TA are omitted from the import. File
          columns named Passed, Failed, Yes or No are ignored. Click any red cell
          to fix errors directly in the spreadsheet grid.
        </Typography>
      </Box>

      {unmappedPrograms.length > 0 && (
        <Box sx={{ ...errorCallout, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body1" color="error" fontWeight="bold">
              Unmapped Study Programs Detected ({unmappedPrograms.length})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The following programs are not recognized: {unmappedPrograms.join(', ')}.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AutoFixHighIcon />}
            onClick={() => setResolverOpen(true)}
            sx={{ textTransform: 'none', ml: 2 }}
          >
            Resolve &amp; Map Programs
          </Button>
        </Box>
      )}

      {hasErrors && unmappedPrograms.length === 0 && (
        <Box sx={{ ...errorCallout, mb: 3 }}>
          <Typography variant="body1" color="error" fontWeight="bold">
            Error: Highlighted red cells contain invalid or missing values. Hover over a red cell to view the error details and click into the cell to resolve it before submitting.
          </Typography>
        </Box>
      )}

      <Box
        className="ag-theme-alpine"
        sx={{ ...gridFrame, minHeight: layout.gridMinHeight, height: { xs: 480, md: 560 }, mb: 3 }}
      >
        <AgGridReact<PreviewRecord>
          rowData={previewData}
          singleClickEdit={true}
          stopEditingWhenCellsLoseFocus={true}
          tooltipShowDelay={150}
          onGridReady={(params: GridReadyEvent<PreviewRecord>) => {
            setGridApi(params.api);
            setWizardGridApi(params.api);
          }}
          onRowDataUpdated={(params: RowDataUpdatedEvent<PreviewRecord>) => {
            params.api.forEachNode((node: IRowNode<PreviewRecord>) => {
              if (!node.data) return;
              if (node.data.is_valid) node.setSelected(true);
            });
          }}
          onCellValueChanged={(event: CellValueChangedEvent<PreviewRecord>) => {
            if (!event.data) return;
            recomputePreviewRowValidation(event.data, dynamicPrograms);
            if (event.data.is_valid) {
              event.node.setSelected(true);
            }
            setValidationRevision((r) => r + 1);
            event.api.refreshCells({
              rowNodes: [event.node],
              force: true,
            });
            event.api.redrawRows({ rowNodes: [event.node] });
          }}
          rowSelection="multiple"
          columnDefs={columnDefs}
          defaultColDef={{ resizable: true, sortable: true, flex: 1, minWidth: 90 }}
          getRowStyle={(params: RowClassParams<PreviewRecord>) =>
            params.data && !params.data.is_valid
              ? { background: tint(semantic.error).bg }
              : undefined
          }
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" color="inherit" onClick={() => setActiveStep(2)} sx={{ px: 3 }}>
          &larr; Back
        </Button>
        <Button
          variant="contained"
          size="large"
          disabled={hasErrors || previewData.length === 0}
          onClick={() => void confirmImport()}
          sx={{ px: 4 }}
        >
          Complete Import
        </Button>
      </Box>
    </Box>
  );
};
