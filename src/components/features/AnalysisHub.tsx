import { Box, Typography, Grid, Card, CardContent, Fade } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import type { AppState } from '../../hooks/useAppLogic';

export const AnalysisHub = (props: AppState) => {
  const { stats } = props;

  return (
    <Fade in={true} timeout={800}>
      <Box sx={{ flexGrow: 1 }}>
        <Typography
          variant="h3"
          gutterBottom
          sx={{ fontWeight: '800', letterSpacing: '-1.5px', color: '#212121' }}
        >
          Welcome back, Professor Adam! 👋
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, color: 'text.secondary', fontWeight: '400' }}>
          Here are your actionable insights for active cohorts.
        </Typography>

        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'rgba(25, 118, 210, 0.05)', border: '1px solid rgba(25, 118, 210, 0.2)' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" fontWeight="600">
                  Active Enrolled Students
                </Typography>
                <Typography variant="h4" fontWeight="800" sx={{ mt: 1, color: '#1976D2' }}>
                  {stats.kpis?.total_active_students ?? 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'rgba(46, 125, 50, 0.05)', border: '1px solid rgba(46, 125, 50, 0.2)' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" fontWeight="600">
                  University Pass Rate
                </Typography>
                <Typography variant="h4" fontWeight="800" sx={{ mt: 1, color: '#2E7D32' }}>
                  {stats.kpis?.active_pass_rate ?? 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'rgba(255, 143, 0, 0.05)', border: '1px solid rgba(255, 143, 0, 0.2)' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" fontWeight="600">
                  Average Active Grade
                </Typography>
                <Typography variant="h4" fontWeight="800" sx={{ mt: 1, color: '#FF8F00' }}>
                  {stats.kpis?.active_avg_grade ?? 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'rgba(158, 158, 158, 0.05)', border: '1px solid rgba(158, 158, 158, 0.2)' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" fontWeight="600">
                  Archived Courses
                </Typography>
                <Typography variant="h4" fontWeight="800" sx={{ mt: 1, color: '#757575' }}>
                  {stats.kpis?.total_archived_courses ?? 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 4, height: '100%' }}>
                <Typography variant="h5" sx={{ fontWeight: '700', mb: 3 }}>
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
                        stroke="rgba(0,0,0,0.1)"
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
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                        contentStyle={{
                          borderRadius: '16px',
                          border: '1px solid rgba(255,255,255,0.5)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                          backdropFilter: 'blur(20px)',
                        }}
                      />
                      <Bar
                        dataKey="pass_rate"
                        fill="#D32F2F"
                        radius={[0, 6, 6, 0]}
                        name="Pass Rate (%)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
};
