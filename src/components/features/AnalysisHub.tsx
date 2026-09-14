import { Box, Typography, Grid, Card, CardContent, Fade, useTheme } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { useStats } from '../../hooks/useApi';
import { chart, neutral, semantic } from '../../styles/colors';
import { blur } from '../../styles/tokens';
import { pageSubtitle, pageTitle, toneSurface, toneValue, chartTooltip } from '../../styles/mixins';
import { ExamsHeatmap } from './ExamsHeatmap';

export const AnalysisHub = () => {
  const { stats } = useStats();
  const theme = useTheme();

  const kpis = [
    {
      label: 'Active Enrolled Students',
      value: stats.kpis?.total_active_students ?? 0,
      tone: semantic.info,
    },
    {
      label: 'University Pass Rate',
      value: `${stats.kpis?.active_pass_rate ?? 0}%`,
      tone: semantic.success,
    },
    {
      label: 'Average Active Grade',
      value: stats.kpis?.active_avg_grade ?? 0,
      tone: semantic.warning,
    },
    {
      label: 'Archived Courses',
      value: stats.kpis?.total_archived_courses ?? 0,
      tone: neutral[500],
    },
  ];

  return (
    <Fade in={true} timeout={800}>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h3" gutterBottom sx={pageTitle}>
          Welcome back, Professor Adam! 👋
        </Typography>
        <Typography variant="h6" sx={{ ...pageSubtitle, mb: 4 }}>
          Here are your actionable insights for active cohorts.
        </Typography>

        <Grid container spacing={4} sx={{ mb: 4 }}>
          {kpis.map((kpi) => (
            <Grid item xs={12} sm={6} md={3} key={kpi.label}>
              <Card sx={toneSurface(kpi.tone)}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" fontWeight="600">
                    {kpi.label}
                  </Typography>
                  <Typography variant="h4" sx={{ ...toneValue(kpi.tone), mt: 1 }}>
                    {kpi.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 4, height: '100%' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                  Toughest Courses (Lowest Pass Rates)
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Identify which active courses are causing the most failures.
                </Typography>
                <Box sx={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.toughest_courses}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={true}
                        vertical={false}
                        stroke={theme.app.chart.grid}
                      />
                      <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} />
                      <YAxis
                        type="category"
                        dataKey="course_name"
                        width={200}
                        axisLine={false}
                        tickLine={false}
                        style={{ fontSize: '0.85rem' }}
                      />
                      <RechartsTooltip
                        cursor={{ fill: theme.app.chart.cursor }}
                        contentStyle={{ ...chartTooltip(theme), backdropFilter: blur.surface }}
                      />
                      <Bar
                        dataKey="pass_rate"
                        fill={chart.bar}
                        radius={[0, 6, 6, 0]}
                        name="Pass Rate (%)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <ExamsHeatmap heatmapData={stats.activity_heatmap} />
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
};
