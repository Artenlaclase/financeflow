import { adminAuth } from '@/lib/firebase/admin';

/**
 * Resolve authenticated user id from a Next.js Request.
 * - Prefers Authorization: Bearer <idToken> and verifies with Firebase Admin.
 * - In development (non-production), allows dev bypass via `x-dev-uid` header.
 * Throws on failure.
 */
export async function getUserIdFromRequest(req: Request): Promise<string> {
  const getHeader = (name: string) => (req.headers as any).get?.(name) || '';
  const authHeader = getHeader('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.slice(7);
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      return decoded.uid;
    } catch (err) {
      // Fall through to possible dev bypass
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    const devUid = getHeader('x-dev-uid');
    if (devUid) return devUid;
  }

  throw new Error('UNAUTHORIZED');
}
