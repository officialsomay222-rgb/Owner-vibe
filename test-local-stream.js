import { spawn } from 'child_process';

async function test() {

  // Start server
  const server = spawn('npm', ['run', 'dev'], { stdio: 'pipe' });

  // Wait for server to start
  await new Promise(r => setTimeout(r, 4000));

  try {
    const res = await fetch('http://localhost:5173/api/stream?id=dQw4w9WgXcQ', {
        headers: {
            'Range': 'bytes=0-100'
        }
    });
    console.log("Status:", res.status);
    console.log("Headers:", Array.from(res.headers.entries()));
    const buf = await res.arrayBuffer();
    console.log("Body length:", buf.byteLength);
  } catch (e) {
      console.error(e);
  } finally {
      server.kill();
  }
}
test();
