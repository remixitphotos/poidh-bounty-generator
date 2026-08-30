import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'poidh bounty generator', description: 'Turn your Farcaster interests into a live poidh bounty on Base.',
  other: { 'fc:miniapp': JSON.stringify({ version:'1', imageUrl:'/og.svg', button:{ title:'Generate bounty', action:{ type:'launch_miniapp', name:'poidh bounty generator', url:'/', splashImageUrl:'/splash.svg', splashBackgroundColor:'#f6f2e8' } } }) }
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
