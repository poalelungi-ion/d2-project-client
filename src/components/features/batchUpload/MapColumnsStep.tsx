import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  useTheme,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import type { NameSplitRule } from '../../../types';
import { useUploadWizard } from './uploadWizardContext';
import { inspectUploadHeaders, type UploadHeadersResponse } from '../../../api/uploads';
import { semantic, tint } from '../../../styles/colors';
import { borders, radii } from '../../../styles/tokens';
import { monoChip, segmentedOption, segmentedTrack } from '../../../styles/mixins';
import {
  CANONICAL_HEADERS,
  FIELD_LABEL,
  TARGET_FIELD_OPTIONS,
  classifyHeaders,
  fieldForHeader,
  headersAreImportable,
  headersFromTabularText,
  samplesFromTabularText,
  type ClassifiedHeader,
} from '../../../utils/columnNames';

const EXAMPLES: Record<string, string> = {
  Matrikelnr: 'e.g. 1012345',
  Name: 'e.g. Schneider, Lena',
  'First Name': 'e.g. Lena',
  'Last Name': 'e.g. Schneider',
  Studiengang: 'e.g. SE Master',
  Fachsemester: 'e.g. 3',
  Note: 'e.g. 1.7, NE, EX, AT',
};

const CONTRACT_ROWS: ClassifiedHeader[] = CANONICAL_HEADERS.map((name) => ({
  source: name,
  target: name,
  status: 'Mapped',
  field: fieldForHeader(name),
}));

const TARGET_SCHEMA = [
  { name: 'Matrikelnummer', req: 'required', field: 'student_id' },
  { name: 'First name', req: 'optional', field: 'first_name' },
  { name: 'Last name', req: 'required', field: 'last_name' },
  { name: 'Study program', req: 'optional', field: 'program' },
  { name: 'Semester (Fachsemester)', req: 'optional', field: 'semester' },
  { name: 'Grade', req: 'required', field: 'grade' },
] as const;

const NAME_SPLIT_RULES: readonly NameSplitRule[] = ['Last, First', 'First Last'];

const statusColor = (status: ClassifiedHeader['status']): string => {
  if (status === 'Mapped') return semantic.success;
  if (status === 'Ignored') return semantic.info;
  if (status === 'Duplicate') return semantic.warning;
  return semantic.error;
};

export const MapColumnsStep = () => {
  const {
    file,
    paste,
    sourceLabel,
    nameSplitRule,
    setNameSplitRule,
    setColumnMapping,
    setStep: setActiveStep,
    runPreview,
  } = useUploadWizard();

  const theme = useTheme();
  const [fileHeaders, setFileHeaders] = useState<string[] | null>(null);
  const [fileSamples, setFileSamples] = useState<Record<string, string>>({});
  const [loadingHeaders, setLoadingHeaders] = useState(false);
  const [userOverrides, setUserOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    setUserOverrides({});
    if (paste.trim()) {
      const headers = headersFromTabularText(paste);
      const { samples } = samplesFromTabularText(paste);
      setFileHeaders(headers);
      setFileSamples(samples);
      setLoadingHeaders(false);
      return;
    }
    if (file && /\.(csv|tsv)$/i.test(file.name)) {
      let cancelled = false;
      setLoadingHeaders(true);
      void file.text().then((text) => {
        if (!cancelled) {
          const headers = headersFromTabularText(text);
          const { samples } = samplesFromTabularText(text);
          setFileHeaders(headers);
          setFileSamples(samples);
          setLoadingHeaders(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }
    if (file) {
      let cancelled = false;
      setLoadingHeaders(true);
      const formData = new FormData();
      formData.append('file', file);
      void inspectUploadHeaders(formData)
        .then(async (res) => {
          if (cancelled || !res.ok) return;
          const data = (await res.json()) as UploadHeadersResponse;
          if (!cancelled && Array.isArray(data.headers) && data.headers.length > 0) {
            setFileHeaders(data.headers);
            setFileSamples(data.samples ?? {});
          }
        })
        .catch(() => {
          // Fallback to contract rows if offline or in unit test without server
        })
        .finally(() => {
          if (!cancelled) setLoadingHeaders(false);
        });
      return () => {
        cancelled = true;
      };
    }
    setFileHeaders(null);
    setFileSamples({});
    setLoadingHeaders(false);
  }, [file, paste]);

  const rows = useMemo(
    () =>
      fileHeaders && fileHeaders.length > 0
        ? classifyHeaders(fileHeaders, userOverrides)
        : classifyHeaders(
            CONTRACT_ROWS.map((r) => r.source),
            userOverrides,
          ),
    [fileHeaders, userOverrides],
  );

  // Sync resolved column mapping into wizard context so runPreview sends it to the backend
  useEffect(() => {
    if (!setColumnMapping) return;
    const mappingObj: Record<string, string> = {};
    for (const row of rows) {
      if (row.status === 'Mapped' && row.field) {
        mappingObj[row.source] = row.field;
      } else if (row.status === 'Ignored') {
        mappingObj[row.source] = 'ignore';
      }
    }
    setColumnMapping(mappingObj);
  }, [rows, setColumnMapping]);

  const checkingFile = fileHeaders != null && fileHeaders.length > 0;
  const canContinue = !checkingFile || headersAreImportable(rows);

  const mappedFields = useMemo(() => {
    const set = new Set<string>();
    for (const row of rows) {
      if (row.status === 'Mapped') {
        const f = row.field ?? fieldForHeader(row.target) ?? fieldForHeader(row.source);
        if (f) set.add(f);
      }
    }
    return set;
  }, [rows]);

  const hasCombinedName = mappedFields.has('name');
  const hasUnresolvedColumns = rows.some(
    (row) => row.status === 'Unrecognized' || row.status === 'Duplicate',
  );

  const handleMappingChange = (sourceColumn: string, selectedValue: string) => {
    setUserOverrides((prev) => ({
      ...prev,
      [sourceColumn]: selectedValue,
    }));
  };

  const handleIgnoreAllUnresolved = () => {
    setUserOverrides((prev) => {
      const next = { ...prev };
      for (const row of rows) {
        if (row.status === 'Unrecognized' || row.status === 'Duplicate') {
          next[row.source] = 'ignore';
        }
      }
      return next;
    });
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ ...monoChip, mr: 2 }}>{sourceLabel}</Box>
          {loadingHeaders ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={14} />
              <Typography variant="body2" color="text.secondary">
                Inspecting spreadsheet columns...
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {checkingFile
                ? `${fileHeaders?.length ?? 0} column${fileHeaders?.length === 1 ? '' : 's'} in the file`
                : 'Map your file columns to the target schema fields below.'}
            </Typography>
          )}
        </Box>

        {hasUnresolvedColumns && (
          <Button
            size="small"
            variant="outlined"
            color="primary"
            onClick={handleIgnoreAllUnresolved}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Ignore Unrecognized / Duplicate Columns
          </Button>
        )}
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Box
            sx={{
              border: borders.hairline(theme.app.surface.hairline),
              borderRadius: radii.lg,
              overflow: 'hidden',
              mb: 3,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                bgcolor: theme.app.surface.solid,
                px: 3,
                py: 1.5,
                borderBottom: borders.hairline(theme.app.surface.hairline),
              }}
            >
              <Typography
                variant="overline"
                sx={{ width: '40%', fontWeight: 700, color: 'text.secondary' }}
              >
                COLUMN IN FILE
              </Typography>
              <Typography
                variant="overline"
                sx={{ width: '40%', fontWeight: 700, color: 'text.secondary' }}
              >
                MAPS TO
              </Typography>
              <Typography
                variant="overline"
                sx={{ width: '20%', fontWeight: 700, color: 'text.secondary', textAlign: 'right' }}
              >
                STATUS
              </Typography>
            </Box>
            {rows.map((mapping, index) => {
              const resolvedField =
                mapping.field ?? fieldForHeader(mapping.target) ?? fieldForHeader(mapping.source);
              const selectValue =
                mapping.status === 'Ignored'
                  ? 'ignore'
                  : mapping.status === 'Unrecognized' || !resolvedField
                    ? '—'
                    : resolvedField;

              const sampleText =
                fileSamples[mapping.source] ??
                EXAMPLES[mapping.source] ??
                EXAMPLES[mapping.target] ??
                EXAMPLES[FIELD_LABEL[fieldForHeader(mapping.source) ?? ''] ?? ''] ??
                '';

              return (
                <Box
                  key={`${mapping.source}-${index}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 3,
                    py: 2,
                    borderBottom:
                      index === rows.length - 1
                        ? 'none'
                        : (t) => `1px solid ${t.palette.divider}`,
                  }}
                >
                  <Box sx={{ width: '40%', pr: 2 }}>
                    <Typography variant="subtitle2" fontWeight="700">
                      {mapping.source}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {sampleText}
                    </Typography>
                  </Box>
                  <Box sx={{ width: '40%' }}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      value={selectValue}
                      onChange={(e) => handleMappingChange(mapping.source, e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
                    >
                      {selectValue === '—' && (
                        <MenuItem value="—" disabled>
                          — (Select target or ignore)
                        </MenuItem>
                      )}
                      {TARGET_FIELD_OPTIONS.map((opt) => (
                        <MenuItem key={opt.field} value={opt.field}>
                          {opt.displayLabel}
                        </MenuItem>
                      ))}
                      <MenuItem value="ignore">Ignored (Skip column)</MenuItem>
                    </TextField>
                  </Box>
                  <Box sx={{ width: '20%', textAlign: 'right' }}>
                    <Typography
                      variant="caption"
                      sx={{ color: statusColor(mapping.status), fontWeight: 700 }}
                    >
                      {mapping.status}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {hasCombinedName && (
            <Box
              sx={{
                bgcolor: tint(semantic.violet).bg,
                border: borders.hairline(tint(semantic.violet).border),
                borderRadius: radii.lg,
                p: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Typography variant="body2" sx={{ color: semantic.violetStrong, fontWeight: 600 }}>
                A single name column was found. Split it as:
              </Typography>
              <Box
                sx={{
                  ...segmentedTrack,
                  bgcolor: 'background.paper',
                  border: borders.hairline(theme.app.surface.hairline),
                }}
              >
                {NAME_SPLIT_RULES.map((rule) => (
                  <Button
                    key={rule}
                    variant="text"
                    onClick={() => setNameSplitRule(rule)}
                    sx={{
                      ...segmentedOption(nameSplitRule === rule),
                      px: 1,
                      minWidth: 0,
                      fontSize: '0.8rem',
                    }}
                  >
                    {rule}
                  </Button>
                ))}
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                &mdash; Schneider, Lena
              </Typography>
            </Box>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: radii.lg,
              p: 3,
              bgcolor: (t) => (t.palette.mode === 'dark' ? t.app.surface.solid : 'grey.50'),
              borderColor: (t) =>
                t.palette.mode === 'dark' ? t.app.surface.hairline : t.palette.divider,
            }}
          >
            <Typography
              variant="overline"
              sx={{
                fontWeight: 800,
                color: 'text.secondary',
                letterSpacing: '0.08em',
                mb: 2,
                display: 'block',
              }}
            >
              TARGET SCHEMA
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
              {TARGET_SCHEMA.map((f) => {
                const isSatisfied =
                  mappedFields.has(f.field) ||
                  ((f.field === 'first_name' || f.field === 'last_name') && hasCombinedName);
                return (
                  <Box
                    key={f.name}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {isSatisfied ? (
                        <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main', mr: 1 }} />
                      ) : (
                        <RadioButtonUncheckedIcon
                          sx={{
                            fontSize: 16,
                            color: f.req === 'required' ? 'warning.main' : 'text.disabled',
                            mr: 1,
                          }}
                        />
                      )}
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {f.name}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        fontSize: '0.7rem',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {f.req}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.5 }}
            >
              Grades must be numeric German marks (1.0 &ndash; 5.0). Status codes
              such as NE, EX, NA and TA are filtered out and those students are
              not tracked. Extra columns (such as task points 1a, 1b, Points,
              Attended, Publish, Attest, Notes, Passed/Failed, or course columns)
              are ignored automatically, and you can dynamically map any column
              using the dropdowns on the left.
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6 }}>
        <Button variant="outlined" color="inherit" onClick={() => setActiveStep(1)} sx={{ px: 3 }}>
          &larr; Back
        </Button>
        <Button
          variant="contained"
          size="large"
          disabled={!canContinue}
          onClick={() => void runPreview()}
          sx={{ px: 4 }}
        >
          Standardise &amp; review &rarr;
        </Button>
      </Box>
    </Box>
  );
};
