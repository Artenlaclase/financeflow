import { Card, CardContent, Typography, Box } from '@mui/material';
import { useFinance } from '../../../contexts/FinanceContext';

export default function BalanceCard() {
  const { balance } = useFinance();

  return (
    <Card sx={{ minWidth: 275, mb: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div">
          Saldo Actual
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="h4" color={balance >= 0 ? 'success.main' : 'error.main'}>
            ${balance.toFixed(2)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
