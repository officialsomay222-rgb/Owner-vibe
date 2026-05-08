const id = 'dQw4w9WgXcQ'; // Rick astley
async function test() {
  const payload = {
    url: `https://www.youtube.com/watch?v=${id}`,
    downloadMode: 'audio',
    audioFormat: 'best'
  };
  const res = await fetch('https://api.cobalt.tools', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  console.log(res.status);
  const data = await res.json();
  console.log(data);
}
test();
