import LoginForm from '../../../components/shared/Auth/LoginForm';
import { Container, Paper, Box } from '@mui/material';

export default function LoginPage() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <LoginForm />
        </Paper>
      </Box>
    </Container>
  );
}
