import { Container, Grid, Typography, Box } from '@mui/material';
import BalanceCard from '../../components/features/Dashboard/BalanceCard';
import QuickActions from '../../components/features/Dashboard/QuickActions';

export default function DashboardPage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Financiero
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <BalanceCard />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <QuickActions />
        </Grid>
      </Grid>
    </Container>
  );
}
