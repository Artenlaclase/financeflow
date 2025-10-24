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

  const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });

  const onClick = async () => {
    if (!user) return;
    // 1) Create link token (server)
    const token = await user.getIdToken();
    const res = await fetch('/api/bank/create-link-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ userId: user.uid })
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('create-link-token error', data);
      return;
    }

    const { linkToken } = data;
    const pk = process.env.NEXT_PUBLIC_FINTOC_PUBLIC_KEY;

    try {
      // Intentar cargar el widget real de Fintoc si está disponible públicamente
      await loadScript('https://js.fintoc.com/v2/');
      const anyWin = window as any;
      if (anyWin?.Fintoc && typeof anyWin.Fintoc.open === 'function' && pk) {
        anyWin.Fintoc.open({
          publicKey: pk,
          linkToken,
          onSuccess: async (payload: { publicToken: string; institutionId?: string }) => {
            try {
              const res = await fetch('/api/bank/exchange-public-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid, publicToken: payload.publicToken, institutionId: payload.institutionId })
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data?.error || 'Error en intercambio');
              setMsg('Conexión guardada. Ya puedes sincronizar transacciones.');
            } catch (e: any) {
              setErr(e?.message || 'Error');
            }
          },
          onExit: () => {
            // Usuario cerró el widget
          }
        });
        return; // Usamos el widget real, no abrimos el diálogo sandbox
      }
    } catch (e) {
      console.warn('No se pudo cargar el widget de Fintoc, uso sandbox:', e);
    }

    // Fallback sandbox: mostrar diálogo para pegar/generar public_token
    setOpen(true);
  };

  return (
    <>
      <Button variant="contained" color="primary" onClick={onClick}>
        Conectar banco (Fintoc)
      </Button>
      <Dialog open={open} onClose={() => !loading && setOpen(false)}>
  <DialogTitle>Conectar con Fintoc</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Pega tu public_token o un link_id (por ejemplo: link_abc123). En sandbox, puedes usar “Generar token sandbox”.
          </Alert>
          <TextField
            fullWidth
            label="Token o Link ID"
            value={publicToken}
            onChange={(e) => setPublicToken(e.target.value)}
            placeholder="public-sandbox-... o link_..."
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
              const isLinkId = publicToken.startsWith('link_');
              const isAccountId = publicToken.startsWith('acc_');
              const token = await user.getIdToken();
              const res = await fetch('/api/bank/exchange-public-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ 
                  userId: user.uid, 
                  ...(isLinkId ? { linkId: publicToken } : { publicToken }),
                  ...(isAccountId ? { accountId: publicToken } : {})
                })
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
