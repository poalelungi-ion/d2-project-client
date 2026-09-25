import { AgGridReact } from 'ag-grid-react';
import type {
  CellValueChangedEvent,
  GridReadyEvent,
  ICellRendererParams,
  RowClassParams,
  RowDataUpdatedEvent,
} from 'ag-grid-community';
import { Box, Typography, Button } from '@mui/material';
import type { PreviewRecord } from '../../../types';
import { useUploadWizard } from './uploadWizardContext';
import { semantic, tint, gradeOutcomeColor } from '../../../styles/colors';
import { errorCallout } from '../../../styles/mixins';
import {
  evaluateGradeCell,
  isOfficialAbsenceCell,
  outcomeLabel,
} from '../../../utils/gradeOutcome';
import {
  STUDY_PROGRAM_OPTIONS,
  formatValidationIssues,
  isAllowedStudyProgram,
} from '../../../utils/studyProgram';

export const ReviewStep = () => {
  const {
    preview: previewData,
    setGridApi,
    setStep: setActiveStep,
    confirmImport,
  } = useUploadWizard();

  const hasErrors = previewData.some((r) => !r.is_valid);

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="700">
          Review Data &amp; Validation
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Pass, Fail and Excused are calculated from the grade or NE/EX/AT. File
          columns named Passed, Failed, Yes or No are ignored.
        </Typography>
      </Box>

      {hasErrors && (
        <Box sx={{ ...errorCallout, mb: 3 }}>
          <Typography variant="body1" color="error" fontWeight="bold">
            Warning: Some records are missing required fields. You can still import, but
            incomplete rows will be marked as &quot;Unknown&quot;.
          </Typography>
        </Box>
      )}

      <Box className="ag-theme-alpine" sx={{ height: 400, width: '100%', mb: 3 }}>
        <AgGridReact<PreviewRecord>
          rowData={previewData}
          onGridReady={(params: GridReadyEvent<PreviewRecord>) => setGridApi(params.api)}
          onRowDataUpdated={(params: RowDataUpdatedEvent<PreviewRecord>) => {
            params.api.forEachNode((node) => {
              if (!node.data) return;
              if (node.data.is_valid) node.setSelected(true);
            });
          }}
          onCellValueChanged={(event: CellValueChangedEvent<PreviewRecord>) => {
            if (event.colDef.field !== 'program' || !event.data) return;
            const invalid = (event.data.invalid_fields ?? []).filter(
              (field) => field !== 'Study Program',
            );
            event.data.invalid_fields = isAllowedStudyProgram(String(event.newValue ?? ''))
              ? invalid
              : [...invalid, 'Study Program'];
            event.data.is_valid =
              (event.data.missing_fields?.length ?? 0) === 0 &&
              event.data.invalid_fields.length === 0;
            event.api.refreshCells({
              rowNodes: [event.node],
              columns: ['validationIssues'],
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
              cellEditorParams: { values: STUDY_PROGRAM_OPTIONS },
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
