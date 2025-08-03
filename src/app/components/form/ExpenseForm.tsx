import { useState } from 'react';
import { Button, TextField, MenuItem, Box, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { addExpense } from '../../lib/firebaseUtils';
import { useFinance } from '../../context/FinanceContext';

const categories = [
  'Comida',
  'Transporte',
  'Vivienda',
  'Entretenimiento',
  'Salud',
  'Educación',
  'Otros'
];

export default function ExpenseForm() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date());
  const { refreshData } = useFinance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addExpense({
      amount: parseFloat(amount),
      description,
      category,
      date: date.toISOString()
    });
    refreshData();
    // Reset form
    setAmount('');
    setDescription('');
    setCategory('');
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Registrar Gasto
      </Typography>
      <TextField
        label="Monto"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        fullWidth
        required
        margin="normal"
      />
      <TextField
        label="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        fullWidth
        required
        margin="normal"
      />
      <TextField
        select
        label="Categoría"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        fullWidth
        required
        margin="normal"
      >
        {categories.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>
      <DatePicker
        label="Fecha"
        value={date}
        onChange={(newValue) => setDate(newValue || new Date())}
        renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
      />
      <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
        Registrar Gasto
      </Button>
    </Box>
  );
}