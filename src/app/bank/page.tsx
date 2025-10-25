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
  const [institutionId, setInstitutionId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
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
        if (data?.institutionId) setInstitutionId(data.institutionId);
        if (data?.accountId) setAccountId(data.accountId);
      } else {
        setConnected(false);
        setLastUpdated('');
        setInstitutionId('');
        setAccountId('');
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
      const token = await user.getIdToken();
      const res = await fetch('/api/bank/sync-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: user.uid, fromISO: from.toISOString(), toISO: to.toISOString() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error de sincronización');
      const triedArr: string[] = data?.debug?.providerDebug?.tried || [];
      const firstTried = triedArr[0]?.replace('http:', '') || '';
      const lastTried = triedArr[triedArr.length - 1]?.replace('http:', '') || '';
      const extra = data?.debug ? ` (sandbox:${data.debug.forceSandbox ? 'on' : 'off'}, key:${data.debug.keyType}` +
        (data.debug.idIsLink !== undefined ? `, idIsLink:${data.debug.idIsLink ? 'true' : 'false'}` : '') +
        (data.debug.usedAccountId ? `, account:${data.debug.usedAccountId}` : '') +
        (data.debug.providerDebug ? `, method:${data.debug.providerDebug.method || 'n/a'}` : '') +
        (data.debug.providerDebug?.endpoint ? `, endpoint:${data.debug.providerDebug.endpoint}` : '') +
        (triedArr.length ? `, tried:${triedArr.length}` : '') +
        (firstTried ? `, first:${firstTried}` : '') +
        (lastTried && lastTried !== firstTried ? `, last:${lastTried}` : '') +
        (data.debug.providerDebug?.error ? `, error:${data.debug.providerDebug.error}` : '') +
        `)` : '';
      setResult(`Sincronización completa: ${data.imported} transacciones${extra}`);
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
              {connected && (
                <>
                  {institutionId ? ` · Institución: ${institutionId}` : ''}
                  {accountId ? ` · Cuenta: ${accountId}` : ''}
                </>
              )}
            </Typography>
            {!connected && (
              <ConnectBankButton onConnected={() => {
                setConnected(true);
                setLastUpdated(new Date().toLocaleString());
              }} />
            )}
            {connected && (
              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={sync90Days} disabled={syncing}>
                  {syncing ? 'Sincronizando…' : 'Sincronizar últimos 90 días'}
                </Button>
                <ConnectBankButton onConnected={() => {
                  setConnected(true);
                  setLastUpdated(new Date().toLocaleString());
                }} />
                <Button color="error" onClick={async () => {
                  if (!user) return;
                  setError(''); setResult('');
                  try {
                    const token = await user.getIdToken();
                    const res = await fetch('/api/bank/disconnect', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({ provider: 'fintoc' })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data?.error || 'Error al desconectar');
                    setConnected(false);
                    setLastUpdated('');
                    setInstitutionId('');
                    setAccountId('');
                    setResult('Conexión eliminada');
                  } catch (e: any) {
                    setError(e?.message || 'Error desconocido');
                  }
                }}>Desconectar</Button>
              </Stack>
            )}
            {result && <Alert severity="success">{result}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
