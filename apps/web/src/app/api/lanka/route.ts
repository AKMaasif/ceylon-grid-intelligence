import { cookies } from 'next/headers';
import { parseSession, assertSameOrigin } from '@/server/lanka/security';
import { workspace } from '@/server/lanka/workspace';
import { getSandboxStore } from '@/server/lanka/store';
import { MutationSchema } from '@/features/lanka/contracts';
import { errorResponse, json, readJson } from '@/server/lanka/http';

export const runtime = 'nodejs';
export async function GET(request: Request) {
  try {
    const session = parseSession((await cookies()).get('lanka_sandbox')?.value);
    const query = new URL(request.url).searchParams;
    return json(
      workspace(
        session,
        query.get('scenario') ?? 'cloudy_afternoon',
        query.get('account') ?? undefined
      )
    );
  } catch (error) {
    return errorResponse(error);
  }
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = parseSession((await cookies()).get('lanka_sandbox')?.value);
    const input = MutationSchema.parse(await readJson(request));
    const store = getSandboxStore();
    if (!input.confirmation)
      return json({ confirmation: store.preview(session, input.action, input.version) });
    return json({ event: store.commit(session, input.action, input.version, input.confirmation) });
  } catch (error) {
    return errorResponse(error);
  }
}
