import { AgGridReact } from 'ag-grid-react';
import type {
  GridReadyEvent,
  ICellRendererParams,
  RowClassParams,
  RowDataUpdatedEvent,
  RowSelectedEvent,
} from 'ag-grid-community';
import { Box, Typography, Button } from '@mui/material';
import type { PreviewRecord } from '../../../types';
import { useUploadWizard } from './uploadWizardContext';
import { semantic, tint } from '../../../styles/colors';
import { errorCallout } from '../../../styles/mixins';

/**
 * Grades the backend could not parse into a number. 
 */
const UNPARSEABLE_GRADES = ['na', 'ta', 'ne', 'nan', '', 'at'];

const isUnparseableGrade = (value: unknown): boolean =>
  UNPARSEABLE_GRADES.includes(String(value).toLowerCase().trim());

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
          Please review the parsed records. Rows missing required fields are highlighted.
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
              if (!isUnparseableGrade(node.data.grade) && node.data.is_valid) {
                node.setSelected(true);
              }
            });
          }}
          onRowSelected={(event: RowSelectedEvent<PreviewRecord>) => {
            if (event.node.isSelected() && isUnparseableGrade(event.data?.grade)) {
              event.node.setDataValue('grade', '5.0');
            }
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
            { field: 'program', headerName: 'Program', editable: true, flex: 1.2, minWidth: 130 },
            { field: 'semester', headerName: 'Semester', editable: true, flex: 0.8, minWidth: 100 },
            { field: 'grade', headerName: 'Grade', editable: true, flex: 0.6, minWidth: 90 },
            {
              field: 'missing_fields',
              headerName: 'Validation Issues',
              flex: 2,
              minWidth: 240,
              cellRenderer: (params: ICellRendererParams<PreviewRecord, string[]>) => {
                if (!params.value || params.value.length === 0)
                  return (
                    <span style={{ color: semantic.success, fontWeight: 'bold' }}>Valid</span>
                  );
                return (
                  <span style={{ color: semantic.error, fontWeight: 'bold' }}>
                    Missing: {params.value.join(', ')}
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
