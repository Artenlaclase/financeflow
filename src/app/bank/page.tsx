"use client";

import { useEffect, useState } from 'react';
import { Container, Card, CardContent, Typography, Box, Button, Alert, Stack } from '@mui/material';
import ConnectBankButton from '@/components/features/Bank/ConnectBankButton';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export default function BankPage() {
  const { user } = useAuth();
  const [connected, setConnected] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const ref = doc(db, 'users', user.uid, 'bankConnections', 'fintoc');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setConnected(true);
        const data = snap.data() as any;
        if (data?.updatedAt?.toDate) {
          setLastUpdated(data.updatedAt.toDate().toLocaleString());
        }
      } else {
        setConnected(false);
        setLastUpdated('');
      }
    };
    load();
  }, [user]);

  const sync90Days = async () => {
    if (!user) return;
    setSyncing(true);
    setResult('');
    setError('');
    try {
      const to = new Date();
      const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const res = await fetch('/api/bank/sync-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, fromISO: from.toISOString(), toISO: to.toISOString() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error de sincronización');
      setResult(`Sincronización completa: ${data.imported} transacciones`);
    } catch (e: any) {
      setError(e?.message || 'Error desconocido');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Conexiones Bancarias</Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Fintoc (Chile)</Typography>
            <Typography variant="body2" color="text.secondary">
              Estado: {connected ? 'Conectado' : 'No conectado'}{lastUpdated ? ` (actualizado: ${lastUpdated})` : ''}
            </Typography>
            {!connected && (
              <ConnectBankButton />
            )}
            {connected && (
              <Box>
                <Button variant="contained" onClick={sync90Days} disabled={syncing}>
                  {syncing ? 'Sincronizando…' : 'Sincronizar últimos 90 días'}
                </Button>
              </Box>
            )}
            {result && <Alert severity="success">{result}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
