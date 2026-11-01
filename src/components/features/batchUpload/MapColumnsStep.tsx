import { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Grid, Card, Button, TextField, useTheme } from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import type { NameSplitRule } from '../../../types';
import { useUploadWizard } from './uploadWizardContext';
import { semantic, tint } from '../../../styles/colors';
import { borders, radii } from '../../../styles/tokens';
import { monoChip, segmentedOption, segmentedTrack } from '../../../styles/mixins';
import {
  CANONICAL_HEADERS,
  FIELD_LABEL,
  classifyHeaders,
  fieldForHeader,
  headersAreImportable,
  headersFromTabularText,
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
}));

const TARGET_SCHEMA = [
  { name: 'Matrikelnummer', req: 'required' },
  { name: 'First name', req: 'optional' },
  { name: 'Last name', req: 'required' },
  { name: 'Study program', req: 'optional' },
  { name: 'Semester (Fachsemester)', req: 'optional' },
  { name: 'Grade', req: 'required' },
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
    setStep: setActiveStep,
    runPreview,
  } = useUploadWizard();

  const theme = useTheme();
  const [fileHeaders, setFileHeaders] = useState<string[] | null>(null);

  useEffect(() => {
    if (paste.trim()) {
      setFileHeaders(headersFromTabularText(paste));
      return;
    }
    if (file && /\.(csv|tsv)$/i.test(file.name)) {
      let cancelled = false;
      void file.text().then((text) => {
        if (!cancelled) setFileHeaders(headersFromTabularText(text));
      });
      return () => {
        cancelled = true;
      };
    }
    setFileHeaders(null);
  }, [file, paste]);

  const rows = useMemo(
    () => (fileHeaders && fileHeaders.length > 0 ? classifyHeaders(fileHeaders) : CONTRACT_ROWS),
    [fileHeaders],
  );
  const checkingFile = fileHeaders != null && fileHeaders.length > 0;
  const canContinue = !checkingFile || headersAreImportable(rows);
  const hasCombinedName = rows.some(
    (row) => row.status === 'Mapped' && fieldForHeader(row.source) === 'name',
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box sx={{ ...monoChip, mr: 2 }}>{sourceLabel}</Box>
        <Typography variant="body2" color="text.secondary">
          {checkingFile
            ? `${fileHeaders?.length ?? 0} column${fileHeaders?.length === 1 ? '' : 's'} in the file`
            : 'Headers must match the standard names. Excel files are checked on the next step.'}
        </Typography>
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
              <Typography variant="overline" sx={{ width: '40%', fontWeight: 700, color: 'text.secondary' }}>
                COLUMN IN FILE
              </Typography>
              <Typography variant="overline" sx={{ width: '40%', fontWeight: 700, color: 'text.secondary' }}>
                MAPS TO
              </Typography>
              <Typography
                variant="overline"
                sx={{ width: '20%', fontWeight: 700, color: 'text.secondary', textAlign: 'right' }}
              >
                STATUS
              </Typography>
            </Box>
            {rows.map((mapping, index) => (
              <Box
                key={`${mapping.source}-${index}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 3,
                  py: 2,
                  borderBottom:
                    index === rows.length - 1 ? 'none' : (t) => `1px solid ${t.palette.divider}`,
                }}
              >
                <Box sx={{ width: '40%' }}>
                  <Typography variant="subtitle2" fontWeight="700">
                    {mapping.source}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {EXAMPLES[mapping.source] ?? EXAMPLES[FIELD_LABEL[fieldForHeader(mapping.source) ?? ''] ?? ''] ?? ''}
                  </Typography>
                </Box>
                <Box sx={{ width: '40%' }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={mapping.target}
                    InputProps={{ readOnly: true }}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
                  />
                </Box>
                <Box sx={{ width: '20%', textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: statusColor(mapping.status), fontWeight: 700 }}>
                    {mapping.status}
                  </Typography>
                </Box>
              </Box>
            ))}
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
              borderColor: (t) => (t.palette.mode === 'dark' ? t.app.surface.hairline : t.palette.divider),
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
              {TARGET_SCHEMA.map((f) => (
                <Box
                  key={f.name}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main', mr: 1 }} />
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
              ))}
            </Box>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.5 }}
            >
              Grades must be numeric German marks (1.0 &ndash; 5.0). Status codes
              such as NE, EX, NA and TA are filtered out and those students are
              not tracked. Columns named Passed, Failed, Yes or No are ignored
              &mdash; the system calculates the result. So are course, course number
              and course id columns: the course and the course semester were
              already settled in the previous step and apply to every row.
              &quot;Semester&quot; below is the student&apos;s Fachsemester count.
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
