# poidh bounty generator

A Farcaster Mini App that reads the current user's recent Farcaster casts, generates a personalized poidh bounty, lets the user edit/regenerate it, funds it with ETH, executes `createSoloBounty(string,string)` on poidh V3 on Base, decodes `BountyCreated`, and returns the live poidh URL.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set:
- `NEYNAR_API_KEY` — used server-side to fetch up to 100 recent casts for the current FID.
- `OPENAI_API_KEY` — used server-side for bounty generation.
- `NEXT_PUBLIC_URL` — deployed HTTPS origin.
- `FARCASTER_ASSOCIATION_*` — values from the Farcaster manifest/domain association tool.

## Deploy

1. Push this folder to GitHub and import it into Vercel (or deploy with any Next.js host).
2. Add the six environment variables above.
3. Deploy, then verify `https://YOUR_DOMAIN/.well-known/farcaster.json`.
4. Generate/sign the account association for that exact domain in Farcaster's Mini App developer tools, put the three values in Vercel, and redeploy.
5. Test the Mini App from the Farcaster Mini App developer page.

## Onchain details

- Network: Base mainnet (`8453` / `eip155:8453`)
- poidh V3: `0x5555Fa783936C260f77385b4E153B9725feF1719`
- Function: `createSoloBounty(string name,string description)` payable
- Minimum: `0.001 ETH`
- Event: `BountyCreated(uint256 indexed id,address indexed issuer,string title,string description,uint256 amount,uint256 createdAt,bool isOpenBounty,uint256 round)`
- Live URL: `https://poidh.xyz/base/bounty/{contractBountyId + 986}`

Important: poidh V3 rejects contract wallets for bounty creation (`msg.sender == tx.origin`), so bounty creation must be signed by an EOA.
