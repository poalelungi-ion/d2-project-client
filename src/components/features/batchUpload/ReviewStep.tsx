import { useEffect, useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type {
  CellValueChangedEvent,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  IRowNode,
  RowClassParams,
  RowDataUpdatedEvent,
} from 'ag-grid-community';
import {
  Box,
  Typography,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TuneIcon from '@mui/icons-material/Tune';

import type { PreviewRecord } from '../../../types';
import { useUploadWizard } from './uploadWizardContext';
import { useToastStore, useStudyProgramStore } from '../../../stores';
import { semantic, tint, gradeOutcomeColor } from '../../../styles/colors';
import { errorCallout, gridFrame } from '../../../styles/mixins';
import { layout, radii } from '../../../styles/tokens';
import {
  evaluateGradeCell,
  isOfficialAbsenceCell,
  outcomeLabel,
} from '../../../utils/gradeOutcome';
import {
  STUDY_PROGRAM_OPTIONS,
  formatValidationIssues,
  isAllowedStudyProgram,
  normalizeStudyProgram,
  suggestClosestStudyProgram,
} from '../../../utils/studyProgram';
import { StudyProgramResolverDialog } from './StudyProgramResolverDialog';

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
  const [, setMappingRevision] = useState(0);

  const availableProgramOptions = useMemo(() => {
    return Array.from(new Set([...STUDY_PROGRAM_OPTIONS, ...dynamicPrograms]));
  }, [dynamicPrograms]);

  // Automatically normalize aliases on initial load (e.g. M.Sc. SE -> SE Master)
  useEffect(() => {
    let modified = false;
    for (const row of previewData) {
      const normalized = normalizeStudyProgram(row.program);
      if (normalized !== row.program) {
        row.program = normalized;
        modified = true;
      }
      if (
        row.invalid_fields?.includes('Study Program') &&
        isAllowedStudyProgram(row.program, dynamicPrograms)
      ) {
        row.invalid_fields = row.invalid_fields.filter((f) => f !== 'Study Program');
        row.is_valid =
          (row.missing_fields?.length ?? 0) === 0 && row.invalid_fields.length === 0;
        modified = true;
      }
    }
    if (modified) {
      setMappingRevision((r) => r + 1);
      if (gridApi) {
        gridApi.refreshCells({ force: true });
        gridApi.redrawRows();
      }
    }
  }, [previewData, dynamicPrograms, gridApi]);

  const { unmappedPrograms, allDistinctPrograms, programCounts } = useMemo(() => {
    const unmapped = new Set<string>();
    const all = new Set<string>();
    const counts: Record<string, number> = {};
    for (const r of previewData) {
      const prog = r.program?.trim();
      if (prog) {
        all.add(prog);
        counts[prog] = (counts[prog] ?? 0) + 1;
      }
      if (r.invalid_fields?.includes('Study Program') && prog) {
        unmapped.add(prog);
      }
    }
    return {
      unmappedPrograms: Array.from(unmapped),
      allDistinctPrograms: Array.from(all),
      programCounts: counts,
    };
  }, [previewData]);

  // Inline quick-mapping state for unrecognized study programs (#104102)
  const [inlineTargets, setInlineTargets] = useState<Record<string, string>>({});

  const getInlineTarget = (prog: string): string =>
    inlineTargets[prog] ?? suggestClosestStudyProgram(prog, availableProgramOptions);

  const handleApplyMappings = (mappings: Record<string, string>, newPrograms: string[]) => {
    const updatedDynamics = Array.from(new Set([...dynamicPrograms, ...newPrograms]));
    setDynamicPrograms(updatedDynamics);

    const { addAlias } = useStudyProgramStore.getState();
    for (const [source, target] of Object.entries(mappings)) {
      if (source !== target) {
        addAlias(target, source);
      }
    }

    for (const row of previewData) {
      if (mappings[row.program]) {
        row.program = mappings[row.program];
      }
      if (isAllowedStudyProgram(row.program, updatedDynamics)) {
        row.invalid_fields = (row.invalid_fields ?? []).filter((f) => f !== 'Study Program');
        row.is_valid =
          (row.missing_fields?.length ?? 0) === 0 && row.invalid_fields.length === 0;
      }
    }

    setMappingRevision((r) => r + 1);

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

  const handleApplyInlineMappings = () => {
    const mappings: Record<string, string> = {};
    for (const prog of unmappedPrograms) {
      mappings[prog] = getInlineTarget(prog);
    }
    handleApplyMappings(mappings, []);
  };

  const hasErrors = previewData.some((r) => !r.is_valid);
  const dialogPrograms =
    unmappedPrograms.length > 0 ? unmappedPrograms : allDistinctPrograms;

  return (
    <Box sx={{ py: 2 }}>
      {resolverOpen && (
        <StudyProgramResolverDialog
          open={resolverOpen}
          onClose={() => setResolverOpen(false)}
          unmappedPrograms={dialogPrograms}
          existingPrograms={availableProgramOptions}
          programCounts={programCounts}
          onApply={handleApplyMappings}
        />
      )}

      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="700">
            Review Data &amp; Validation
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Pass and Fail are calculated from numeric grades (1.0–5.0). Status
            codes such as NE, EX, NA and TA are omitted from the import. File
            columns named Passed, Failed, Yes or No are ignored.
          </Typography>
        </Box>
        {allDistinctPrograms.length > 0 && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<TuneIcon />}
            onClick={() => setResolverOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Modify Study Program Mappings
          </Button>
        )}
      </Box>

      {unmappedPrograms.length > 0 && (
        <Paper
          variant="outlined"
          data-testid="inline-study-program-mapper"
          sx={{
            ...errorCallout,
            mb: 3,
            p: 2.5,
            borderRadius: radii.lg,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1.5,
            }}
          >
            <Box>
              <Typography variant="body1" color="error" fontWeight="bold">
                Unrecognized Study Programs ({unmappedPrograms.length})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Map each unrecognized study program below to a standardized program or open the
                full mapping dialog to create a new study program.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AutoFixHighIcon />}
                onClick={() => setResolverOpen(true)}
                sx={{ textTransform: 'none' }}
              >
                Resolve &amp; Map Programs
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleApplyInlineMappings}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Apply Quick Mappings
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {unmappedPrograms.map((prog) => (
              <Paper
                key={prog}
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: radii.md,
                  bgcolor: 'background.paper',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={prog}
                    color="error"
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                  <Chip
                    label={`${programCounts[prog] ?? 1} row${(programCounts[prog] ?? 1) === 1 ? '' : 's'}`}
                    size="small"
                    sx={{ height: 22, fontSize: '0.72rem' }}
                  />
                  <ArrowForwardIcon fontSize="small" color="action" />
                </Box>

                <FormControl size="small" sx={{ minWidth: 260, flex: 1, maxWidth: 380 }}>
                  <InputLabel id={`inline-map-label-${prog}`}>
                    Map &quot;{prog}&quot; to Standardized Program
                  </InputLabel>
                  <Select
                    labelId={`inline-map-label-${prog}`}
                    label={`Map "${prog}" to Standardized Program`}
                    value={getInlineTarget(prog)}
                    onChange={(e) =>
                      setInlineTargets((prev) => ({
                        ...prev,
                        [prog]: e.target.value,
                      }))
                    }
                  >
                    {availableProgramOptions.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Paper>
            ))}
          </Box>
        </Paper>
      )}

      {hasErrors && unmappedPrograms.length === 0 && (
        <Box sx={{ ...errorCallout, mb: 3 }}>
          <Typography variant="body1" color="error" fontWeight="bold">
            Warning: Some records are missing required fields. You can still import, but
            incomplete rows will be marked as &quot;Unknown&quot;.
          </Typography>
        </Box>
      )}

      <Box
        className="ag-theme-alpine"
        sx={{ ...gridFrame, minHeight: layout.gridMinHeight, height: { xs: 480, md: 560 }, mb: 3 }}
      >
        <AgGridReact<PreviewRecord>
          rowData={previewData}
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
            if (event.colDef.field !== 'program' || !event.data) return;
            const invalid = (event.data.invalid_fields ?? []).filter(
              (field) => field !== 'Study Program',
            );
            const newValue = normalizeStudyProgram(String(event.newValue ?? ''));
            event.data.program = newValue;
            event.data.invalid_fields = isAllowedStudyProgram(newValue, dynamicPrograms)
              ? invalid
              : [...invalid, 'Study Program'];
            event.data.is_valid =
              (event.data.missing_fields?.length ?? 0) === 0 &&
              event.data.invalid_fields.length === 0;
            setMappingRevision((r) => r + 1);
            event.api.refreshCells({
              rowNodes: [event.node],
              columns: ['program', 'validationIssues'],
              force: true,
            });
            event.api.redrawRows({ rowNodes: [event.node] });
          }}
          rowSelection="multiple"
          columnDefs={[
            {
              field: 'student_id',
              headerName: 'Matrikelnr',
              checkboxSelection: true,
              headerCheckboxSelection: true,
              editable: true,
              flex: 1.1,
              minWidth: 140,
            },
            { field: 'first_name', headerName: 'First Name', editable: true, flex: 1, minWidth: 110 },
            { field: 'last_name', headerName: 'Last Name', editable: true, flex: 1, minWidth: 110 },
            {
              field: 'program',
              headerName: 'Study Program',
              editable: true,
              flex: 1.4,
              minWidth: 180,
              cellEditor: 'agSelectCellEditor',
              cellEditorParams: { values: availableProgramOptions },
            },
            { field: 'semester', headerName: 'Semester', editable: true, flex: 0.8, minWidth: 100 },
            { field: 'grade', headerName: 'Grade', editable: true, flex: 0.6, minWidth: 90 },
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
          ]}
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
          onClick={() => void confirmImport()}
          sx={{ px: 4 }}
        >
          Complete Import
        </Button>
      </Box>
    </Box>
  );
};
