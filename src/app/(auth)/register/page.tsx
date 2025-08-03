import RegisterForm from '../../../components/shared/Auth/RegisterForm';
import { Container, Paper, Box } from '@mui/material';

export default function RegisterPage() {
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <RegisterForm />
        </Paper>
      </Box>
    </Container>
  );
}
