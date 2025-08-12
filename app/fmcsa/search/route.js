export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const query = searchParams.get('q');    // assuming q=docket number
  const webKey = 'ce8453b4abbdd6b60e7b2f16481dc42000194f81';       // replace with your actual webKey or get it dynamically
  if (!type || !query) {
    return new Response(
      JSON.stringify({ error: 'Missing required query parameters: type and q' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  let url;
  if (type === 'docket') {
    url = `https://mobile.fmcsa.dot.gov/qc/services/carriers/docket-number/${encodeURIComponent(query)}?webKey=${encodeURIComponent(webKey)}`;
  } else if (type === 'usdot') {
    url = `https://mobile.fmcsa.dot.gov/qc/services/carriers/${encodeURIComponent(query)}?webKey=${encodeURIComponent(webKey)}`;
  } else {
    return new Response(
      JSON.stringify({ error: `Invalid type parameter: ${type}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const res = await fetch(url);

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `External API error: ${res.status}` }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();

    return new Response(JSON.stringify(type === 'usdot' ? data.content.carrier : data.content[0].carrier), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
