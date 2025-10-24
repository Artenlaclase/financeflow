"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@mui/material';

export default function ConnectBankButton() {
  const { user } = useAuth();

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
    // TODO: Initialize Fintoc Link widget using linkToken. For now, just log.
  };

  return (
    <Button variant="contained" color="primary" onClick={onClick}>
      Conectar banco (Fintoc)
    </Button>
  );
}
