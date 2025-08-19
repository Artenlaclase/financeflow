"use client";

import { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Grid
} from '@mui/material';
import { useUserProfile } from '../../../contexts/UserProfileContext';
import { useAuth } from '../../../contexts/AuthContext';

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function EditProfileDialog({ open, onClose }: EditProfileDialogProps) {
  const { user } = useAuth();
  const { profile, createProfile, updateProfile, loading } = useUserProfile();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
    } else {
      setFirstName('');
      setLastName('');
    }
  }, [profile, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('Por favor ingresa tu nombre y apellido');
      return;
    }

    try {
      const profileData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: user?.email || ''
      };

      if (profile) {
        // Actualizar perfil existente
        await updateProfile(profileData);
      } else {
        // Crear nuevo perfil para usuario existente
        await createProfile(profileData);
      }
      
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el perfil');
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      keepMounted={false}
      disableRestoreFocus
    >
      <DialogTitle>
        <Typography variant="h6">
          {profile ? 'Editar Perfil' : 'Completar Perfil'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {profile 
            ? 'Modifica tu información personal' 
            : 'Agrega tu nombre para personalizar tu experiencia'
          }
        </Typography>
      </DialogTitle>
      
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                fullWidth
                required
                placeholder="Ej: Raul"
                helperText="Tu nombre de pila"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Apellido"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                fullWidth
                required
                placeholder="Ej: Rosales"
                helperText="Tu apellido"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Email"
                value={user?.email || ''}
                fullWidth
                disabled
                helperText="El email no se puede modificar"
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Guardando...' : (profile ? 'Actualizar' : 'Guardar')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
