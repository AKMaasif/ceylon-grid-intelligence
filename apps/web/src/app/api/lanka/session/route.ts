import { cookies } from 'next/headers';
import { z } from 'zod';
import { PersonaSchema } from '@/features/lanka/contracts';
import { assertDemoEnabled, assertSameOrigin, signPayload } from '@/server/lanka/security';
import { errorResponse, json, readJson } from '@/server/lanka/http';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    assertDemoEnabled();
    assertSameOrigin(request);
    const { persona } = z.object({ persona: PersonaSchema }).parse(await readJson(request));
    const session = { persona, expires: Date.now() + 3_600_000 };
    const jar = await cookies();
    jar.set('lanka_sandbox', signPayload(session), {
      httpOnly: true,
      sameSite: 'strict',
      secure: new URL(request.url).protocol === 'https:',
      path: '/',
      maxAge: 3600,
    });
    return json({ session });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    (await cookies()).delete('lanka_sandbox');
    return json({ signedOut: true });
  } catch (error) {
    return errorResponse(error);
  }
}
