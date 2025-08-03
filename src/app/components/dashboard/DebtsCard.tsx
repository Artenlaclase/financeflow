import { Card, CardContent, Typography, List, ListItem, ListItemText, Chip } from '@mui/material';
import { useFinance } from '../../../app/context/FinanceContext';

export default function DebtsCard() {
  const { debts } = useFinance();

  return (
    <Card sx={{ minWidth: 275, mb: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div">
          Deudas Pendientes
        </Typography>
        <List>
          {debts.map((debt) => (
            <ListItem key={debt.id}>
              <ListItemText
                primary={debt.description}
                secondary={`Vence: ${new Date(debt.dueDate).toLocaleDateString()}`}
              />
              <Chip label={`$${debt.amount}`} color="warning" />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}