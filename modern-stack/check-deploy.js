async function check() {
  for (let i = 0; i < 12; i++) {
    await new Promise(r => setTimeout(r, 15000));
    const res = await fetch('https://api.render.com/v1/services/srv-d82sdp83kofs73d4sffg/deploys?limit=1', {
      headers: { Authorization: 'Bearer rnd_SvwYcoXsW4FxAfh65NpPvYp2Ax7A' }
    });
    const d = await res.json();
    const dep = d[0].deploy;
    console.log('[' + new Date().toISOString() + '] ' + dep.id + ': ' + dep.status);
    if (dep.status === 'live' || dep.status.includes('fail')) break;
  }
}
check();
