import { Box, Typography, Grid, Card, Button, TextField, useTheme } from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import type { NameSplitRule } from '../../../types';
import { useUploadWizard } from './uploadWizardContext';
import { semantic, tint } from '../../../styles/colors';
import { borders, radii } from '../../../styles/tokens';
import { monoChip, segmentedOption, segmentedTrack } from '../../../styles/mixins';

/** The read-only mapping table: file column on the left, target on the right. */
const COLUMN_MAPPINGS = [
  {
    source: 'Matrikelnr',
    example: 'e.g. 1012345',
    target: 'Matrikelnummer',
    status: 'Mapped',
    tone: semantic.success,
  },
  {
    source: 'Name',
    example: 'e.g. Schneider, Lena',
    target: 'Full name (auto-split)',
    status: 'Name → split',
    tone: semantic.info,
  },
  {
    source: 'Studiengang',
    example: 'e.g. SE Master',
    target: 'Study program',
    status: 'Mapped',
    tone: semantic.success,
  },
  {
    source: 'Fachsemester',
    example: 'e.g. 3',
    target: 'Semester (Fachsemester count)',
    status: 'Mapped',
    tone: semantic.success,
  },
  {
    source: 'Note',
    example: 'e.g. 1.7, NE, EX, AT',
    target: 'Grade',
    status: 'Mapped',
    tone: semantic.success,
  },
] as const;

const TARGET_SCHEMA = [
  { name: 'Matrikelnummer', req: 'required' },
  { name: 'First name', req: 'optional' },
  { name: 'Last name', req: 'required' },
  { name: 'Study program', req: 'optional' },
  { name: 'Semester (Fachsemester)', req: 'optional' },
  { name: 'Grade', req: 'required' },
] as const;

const NAME_SPLIT_RULES: readonly NameSplitRule[] = ['Last, First', 'First Last'];

export const MapColumnsStep = () => {
  const {
    sourceLabel,
    nameSplitRule,
    setNameSplitRule,
    setStep: setActiveStep,
    runPreview,
  } = useUploadWizard();

  const theme = useTheme();

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box sx={{ ...monoChip, mr: 2 }}>{sourceLabel}</Box>
        <Typography variant="body2" color="text.secondary">
          5 columns &middot; 8 rows detected
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
            {COLUMN_MAPPINGS.map((mapping, index) => (
              <Box
                key={mapping.source}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 3,
                  py: 2,
                  borderBottom:
                    index === COLUMN_MAPPINGS.length - 1
                      ? 'none'
                      : (t) => `1px solid ${t.palette.divider}`,
                }}
              >
                <Box sx={{ width: '40%' }}>
                  <Typography variant="subtitle2" fontWeight="700">
                    {mapping.source}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {mapping.example}
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
                  <Typography variant="caption" sx={{ color: mapping.tone, fontWeight: 700 }}>
                    {mapping.status}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Name Split Helper */}
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
              Grades are validated as German marks (1.0 &ndash; 5.0) or official
              absence codes: NE (no show) and EX (disqualified) fail, AT (medical
              note) is excused. Columns named Passed, Failed, Yes or No are ignored
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
          onClick={() => void runPreview()}
          sx={{ px: 4 }}
        >
          Standardise &amp; review &rarr;
        </Button>
      </Box>
    </Box>
  );
};
