import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Cast = { text?: string; parent_url?: string | null; timestamp?: string; embeds?: Array<{url?: string}> };

export async function POST(req: NextRequest) {
  try {
    const { fid, username, nonce = 0 } = await req.json();
    if (!fid || typeof fid !== 'number') return NextResponse.json({ error: 'Missing Farcaster FID' }, { status: 400 });
    if (!process.env.NEYNAR_API_KEY || !process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Server is missing NEYNAR_API_KEY or OPENAI_API_KEY' }, { status: 500 });
    }

    const url = new URL('https://api.neynar.com/v2/farcaster/feed/user/casts/');
    url.searchParams.set('fid', String(fid));
    url.searchParams.set('limit', '100');
    url.searchParams.set('include_replies', 'true');
    const feedRes = await fetch(url, { headers: { 'x-api-key': process.env.NEYNAR_API_KEY }, cache: 'no-store' });
    if (!feedRes.ok) throw new Error(`Neynar request failed (${feedRes.status})`);
    const feed = await feedRes.json();
    const casts: Cast[] = (feed.casts || []).slice(0, 100);
    const history = casts.map((c, i) => ({
      i: i + 1,
      text: (c.text || '').slice(0, 700),
      channel: c.parent_url || null,
      links: (c.embeds || []).map(e => e.url).filter(Boolean).slice(0, 3)
    })).filter(c => c.text);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: 'gpt-5.6-luna',
      reasoning: { effort: 'low' },
      input: [
        { role: 'system', content: [{ type: 'input_text', text: `You generate excellent poidh.xyz bounties from Farcaster activity. A poidh bounty must be a concrete real-world or online challenge another person can complete and prove with a photo, video, public link, artifact, or other clear evidence. Never merely restate a user's cast. Infer recurring interests and turn them into a fun, specific, achievable challenge. Avoid dangerous, illegal, invasive, discriminatory, sexual, or financial-manipulation tasks. Include objective claim requirements. Return JSON only with keys: title, description, instructions (array of strings), whyItFits, interests (array of 3-6 short strings). The description must be publish-ready and include a concise Proof required section.` }] },
        { role: 'user', content: [{ type: 'input_text', text: JSON.stringify({ fid, username, regenerationNonce: nonce, recentFarcasterActivity: history }) }] }
      ],
      text: { format: { type: 'json_object' } }
    });

    const data = JSON.parse(response.output_text);
    return NextResponse.json({ ...data, castsAnalyzed: history.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Generation failed' }, { status: 500 });
  }
}
