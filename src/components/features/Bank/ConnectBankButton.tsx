"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert } from '@mui/material';

export default function ConnectBankButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [publicToken, setPublicToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>('');
  const [err, setErr] = useState<string>('');

  const onClick = async () => {
    if (!user) return;
    // 1) Create link token (server)
    const res = await fetch('/api/bank/create-link-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.uid })
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('create-link-token error', data);
      return;
    }

    const { linkToken } = data;
    console.log('Link token (stub):', linkToken);
    // TODO: Inicializar Fintoc Link aquí. Mientras tanto, mostramos un diálogo para pegar un public_token sandbox.
    setOpen(true);
  };

  return (
    <>
      <Button variant="contained" color="primary" onClick={onClick}>
        Conectar banco (Fintoc)
      </Button>
      <Dialog open={open} onClose={() => !loading && setOpen(false)}>
        <DialogTitle>Conectar con Fintoc (Sandbox)</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            En sandbox, puedes pegar un public_token simulado o usar “Generar token sandbox”.
          </Alert>
          <TextField
            fullWidth
            label="public_token"
            value={publicToken}
            onChange={(e) => setPublicToken(e.target.value)}
            placeholder="public-sandbox-..."
          />
          {msg && <Alert severity="success" sx={{ mt: 2 }}>{msg}</Alert>}
          {err && <Alert severity="error" sx={{ mt: 2 }}>{err}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={async () => {
            // Generar un token de ejemplo
            setPublicToken(`public-sandbox-${Math.random().toString(36).slice(2)}`);
          }} disabled={loading}>Generar token sandbox</Button>
          <Button variant="contained" onClick={async () => {
            if (!user) return;
            setLoading(true); setMsg(''); setErr('');
            try {
              const res = await fetch('/api/bank/exchange-public-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid, publicToken })
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data?.error || 'Error en intercambio');
              setMsg('Conexión guardada. Ya puedes sincronizar transacciones.');
            } catch (e: any) {
              setErr(e?.message || 'Error');
            } finally {
              setLoading(false);
            }
          }} disabled={loading || !publicToken}>
            {loading ? 'Conectando…' : 'Conectar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
