'use client';
import { useEffect, useMemo, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { createPublicClient, custom, decodeEventLog, encodeFunctionData, formatEther, http, parseEther } from 'viem';
import { base } from 'viem/chains';
import { BASE_CHAIN_ID, MIN_BOUNTY_ETH, POIDH_ADDRESS, poidhAbi, poidhUrl } from '@/lib/poidh';

type Bounty = { title:string; description:string; instructions:string[]; whyItFits:string; interests:string[]; castsAnalyzed:number };
type User = { fid:number; username?:string; displayName?:string; pfpUrl?:string };
const publicClient = createPublicClient({ chain: base, transport: http() });

export default function Home() {
  const [user,setUser]=useState<User|null>(null); const [bounty,setBounty]=useState<Bounty|null>(null);
  const [title,setTitle]=useState(''); const [description,setDescription]=useState(''); const [amount,setAmount]=useState('0.001');
  const [busy,setBusy]=useState(false); const [status,setStatus]=useState(''); const [nonce,setNonce]=useState(0); const [liveUrl,setLiveUrl]=useState(''); const [txHash,setTxHash]=useState('');
  const validAmount=useMemo(()=>{ try{return parseEther(amount||'0')>=parseEther(MIN_BOUNTY_ETH)}catch{return false}},[amount]);

  useEffect(()=>{(async()=>{try{const c=await sdk.context; setUser(c.user as User); await sdk.actions.ready();}catch{setStatus('Open this inside a Farcaster Mini App client to identify your account.')}})()},[]);
  async function generate(nextNonce=nonce){ if(!user)return; setBusy(true);setStatus(nextNonce?'Finding another angle…':'Reading your recent casts…');setLiveUrl(''); try{const r=await fetch('/api/generate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({fid:user.fid,username:user.username,nonce:nextNonce})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Generation failed');setBounty(d);setTitle(d.title);setDescription(d.description);setStatus(`Personalized from ${d.castsAnalyzed} recent casts.`);}catch(e){setStatus(e instanceof Error?e.message:'Generation failed')}finally{setBusy(false)}}
  async function regenerate(){const n=nonce+1;setNonce(n);await generate(n)}
  async function createBounty(){ if(!user||!title.trim()||!description.trim()||!validAmount)return;setBusy(true);setStatus('Preparing Base transaction…');setLiveUrl('');try{
    const provider=await sdk.wallet.getEthereumProvider(); if(!provider)throw new Error('No wallet provider available in this Farcaster client.');
    const accounts=await provider.request({method:'eth_requestAccounts'}) as string[]; if(!accounts?.[0])throw new Error('Wallet connection was not approved.');
    const chainHex=await provider.request({method:'eth_chainId'}) as string; if(parseInt(chainHex,16)!==BASE_CHAIN_ID){await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:'0x2105'}]});}
    const data=encodeFunctionData({abi:poidhAbi,functionName:'createSoloBounty',args:[title.trim(),description.trim()]});
    setStatus('Confirm the bounty funding transaction in your wallet.');
    const hash=await provider.request({method:'eth_sendTransaction',params:[{from:accounts[0],to:POIDH_ADDRESS,data,value:`0x${parseEther(amount).toString(16)}`} ]}) as `0x${string}`; setTxHash(hash); setStatus('Transaction submitted. Waiting for Base confirmation…');
    const receipt=await publicClient.waitForTransactionReceipt({hash}); if(receipt.status!=='success')throw new Error('Transaction reverted.');
    let contractId: bigint | undefined; for(const log of receipt.logs){if(log.address.toLowerCase()!==POIDH_ADDRESS.toLowerCase())continue;try{const decoded=decodeEventLog({abi:poidhAbi,data:log.data,topics:log.topics});if(decoded.eventName==='BountyCreated'){contractId=(decoded.args as {id:bigint}).id;break}}catch{}}
    if(contractId===undefined)throw new Error('Bounty was created, but the BountyCreated event could not be decoded. Use the transaction link to verify it.');
    setLiveUrl(poidhUrl(contractId)); setStatus(`Bounty #${contractId.toString()} is live on poidh.`);
  }catch(e){setStatus(e instanceof Error?e.message:'Transaction failed')}finally{setBusy(false)}}

  return <main><div className="shell"><header><div className="brand"><span className="mark">p.</span><div><b>poidh bounty generator</b><small>personalized by your Farcaster</small></div></div>{user&&<div className="user">{user.pfpUrl?<img src={user.pfpUrl} alt=""/>:<span/>}<div><b>@{user.username||`fid:${user.fid}`}</b><small>FID {user.fid}</small></div></div>}</header>
    <section className="hero"><p className="eyebrow">CASTS → CHALLENGE → BASE</p><h1>Make a bounty that<br/><i>actually sounds like you.</i></h1><p>We read your recent Farcaster activity, turn your interests into a provable poidh challenge, then let you fund it with ETH in one flow.</p>{!bounty&&<button className="primary" disabled={!user||busy} onClick={()=>generate()}>{busy?'Analyzing…':'Generate my bounty'} <span>↗</span></button>}</section>
    {bounty&&<section className="workspace"><div className="fit"><div><span className="dot"/>PERSONALIZATION SIGNAL</div><p>{bounty.whyItFits}</p><div className="tags">{bounty.interests?.map(x=><span key={x}>{x}</span>)}</div></div>
      <label>BOUNTY TITLE<input value={title} onChange={e=>setTitle(e.target.value)} maxLength={120}/></label>
      <label>DESCRIPTION<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={10}/></label>
      <div className="actions"><button className="ghost" disabled={busy} onClick={regenerate}>↻ Regenerate</button><span>Edit anything before you fund it.</span></div>
      <div className="fund"><div><p className="eyebrow">FUND ON BASE</p><h2>Put ETH behind it.</h2><small>Minimum poidh bounty: {MIN_BOUNTY_ETH} ETH</small></div><label className="eth"><input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9.]/g,''))}/><b>ETH</b></label></div>
      <div className="review"><div><small>YOU'RE CREATING</small><b>{title||'Untitled bounty'}</b></div><div><small>REWARD</small><b>{amount||'0'} ETH</b></div></div>
      <button className="primary wide" disabled={busy||!title.trim()||!description.trim()||!validAmount} onClick={createBounty}>{busy?'Working…':'Fund & create on poidh'} <span>→</span></button>
      {amount&&!validAmount&&<p className="error">Enter at least {MIN_BOUNTY_ETH} ETH.</p>}
    </section>}
    {status&&<div className="status">{status}</div>}
    {liveUrl&&<section className="success"><div className="check">✓</div><div><small>ONCHAIN + LIVE</small><h2>Your bounty exists.</h2><p>Transaction confirmed on Base and the poidh bounty URL is ready.</p><a href={liveUrl} target="_blank" rel="noreferrer">View live bounty on poidh ↗</a>{txHash&&<a className="sub" href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer">View transaction</a>}</div></section>}
    <footer><span>poidh V3 · Base</span><span>built for Farcaster Mini Apps</span></footer></div></main>
}
