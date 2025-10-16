import React, {useState} from 'react';
import QRCode from 'qrcode.react';

const BLOCKSTREAM_BASE = 'https://blockstream.info/api';
const ADMIN_ADDRESS = process.env.REACT_APP_ADMIN_ADDRESS || 'bc1q2ld78maaw2qkc8usgqtcpvq2ua6x47lt3u0lsu';

function NovaLogo({className}){
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
        <filter id="f" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#06b6d4" floodOpacity="0.08"/>
        </filter>
      </defs>
      <g filter="url(#f)">
        <path d="M20 40a12 12 0 010-17l6-6a12 12 0 0117 17l-2 2" stroke="url(#g)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M44 24a12 12 0 010 17l-6 6a12 12 0 01-17-17l2-2" stroke="url(#g)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export default function App(){
  const [address, setAddress] = useState('');
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const isAdmin = address && address.trim().toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  function validateBech32(a){
    if(!a) return false;
    return /^bc1[0-9a-zA-Z]{6,}$/i.test(a.trim());
  }

  async function fetchAddress(addr){
    setError(null);
    setLoading(true);
    setCurrent(null);
    try{
      const a = addr.trim();
      if(!validateBech32(a)) throw new Error('Invalid Bech32 address (must start with bc1...)');

      const res = await fetch(`${BLOCKSTREAM_BASE}/address/${a}`);
      if(!res.ok) throw new Error('Address not found');
      const data = await res.json();
      const funded = data.chain_stats.funded_txo_sum || 0;
      const spent = data.chain_stats.spent_txo_sum || 0;
      const balanceSats = funded - spent;

      const txres = await fetch(`${BLOCKSTREAM_BASE}/address/${a}/txs`);
      const txs = txres.ok ? await txres.json() : [];

      setCurrent({balanceSats, balanceBTC: (balanceSats/1e8).toFixed(8), txs});
      setLastFetched(new Date().toISOString());
    }catch(e){
      console.error(e);
      setError(e.message || 'Fetch failed');
    }finally{ setLoading(false); }
  }

  const onConnect = async ()=>{ if(!address) return setError('Enter a Bitcoin address to connect'); await fetchAddress(address); };
  const onCopy = async ()=>{ try{ await navigator.clipboard.writeText(address); alert('Address copied to clipboard'); }catch(e){ alert('Copy failed'); } };
  const exportTxs = ()=>{ if(!current || !current.txs) return alert('No transactions to export'); const csv = current.txs.map(t=>`${t.txid},${t.status && t.status.block_time? t.status.block_time : ''}`).join('\n'); const blob = new Blob([csv], {type:'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'txs.csv'; a.click(); URL.revokeObjectURL(url); };

  return (
    <div className="app">
      <div className="card">
        <div className="header">
          <NovaLogo className="logo" />
          <div>
            <div className="title">NovaChain</div>
            <div className="small">Bitcoin Portal — secure, read-only on-chain dashboard</div>
          </div>
          <div style={{marginLeft:'auto'}}>
            {isAdmin && <div className="adminBadge">ADMIN</div>}
          </div>
        </div>

        <div className="controls">
          <input className="input" placeholder="Enter Bitcoin address (bech32)" value={address} onChange={e=>{setAddress(e.target.value); setError(null);}} />
          <div className="controls-right">
            <button className="btn" onClick={onConnect} disabled={loading}>{loading? 'Loading...' : 'Connect'}</button>
            <button className="btn" onClick={onCopy}>Copy</button>
          </div>
        </div>

        {error && <div style={{marginTop:12,color:'#ffb4b4'}}>{error}</div>}

        <div className="grid">
          <div>
            <div style={{marginTop:16}} className="info card">
              {!current ? (
                <div className="small">Enter a Bitcoin address to load on-chain info (balance & transactions). NovaChain only reads public blockchain data — we never ask for private keys or seed phrases.</div>
              ) : (
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div className="small">Address</div>
                      <div className="addr">{address}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div className="small">Balance</div>
                      <div style={{fontSize:20,fontWeight:700}}>{current.balanceBTC} BTC</div>
                      <div className="small">{current.balanceSats} sats</div>
                    </div>
                  </div>

                  <hr style={{margin:'12px 0',opacity:0.06}} />
                  <div className="small" style={{marginBottom:8}}>Recent transactions (up to 10)</div>
                  <div>
                    {current.txs && current.txs.length===0 && <div className="small">No recent transactions</div>}
                    {current.txs && current.txs.slice(0,10).map((tx,idx)=>{
                      const ts = tx.status && tx.status.block_time ? new Date(tx.status.block_time*1000).toLocaleString() : 'unconfirmed';
                      const txId = tx.txid;
                      return (
                        <div key={txId} className="tx">
                          <div style={{fontWeight:700,fontSize:13}}>{txId}</div>
                          <div className="small">Confirmations: {tx.status && tx.status.confirmed ? 'Confirmed' : 'Unconfirmed'} • {ts}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{marginTop:12,display:'flex',gap:8}}>
                    <button className="btn" onClick={exportTxs}>Export TXs (CSV)</button>
                  </div>

                </div>
              )}
            </div>
          </div>

          <div>
            <div className="card info">
              <div className="small">Network</div>
              <div style={{fontWeight:700,marginTop:8}}>Bitcoin Mainnet</div>
              <div className="small" style={{marginTop:12}}>Admin address (set in environment):</div>
              <div className="addr">{ADMIN_ADDRESS}</div>

              <hr style={{margin:'12px 0',opacity:0.06}} />
              <div className="small">Developer tools</div>
              {isAdmin ? (
                <div style={{marginTop:8}}>
                  <button className="btn" onClick={()=>alert('Admin: placeholder — in a real site you could manage token lists, settings, or analytics here')}>Open Admin Panel</button>
                </div>
              ) : (
                <div className="small" style={{marginTop:8}}>Connect with the admin address to unlock admin controls.</div>
              )}

              <hr style={{margin:'12px 0',opacity:0.06}} />
              <div className="small">Share</div>
              <div className="qrWrap">
                <div className="small">QR for this address</div>
                {address ? <QRCode value={address} size={128} /> : <div className="muted">Enter address to generate QR code</div>}
              </div>

              <hr style={{margin:'12px 0',opacity:0.06}} />
              <div className="small">Security</div>
              <div className="small" style={{marginTop:8}}>NovaChain is read-only: we never ask for private keys or seed phrases. To perform transactions, use your wallet software directly.</div>
            </div>
          </div>
        </div>

        <div className="footer">NovaChain • Built for read-only BTC dashboards • {new Date().getFullYear()}</div>
      </div>
    </div>
  );
}
