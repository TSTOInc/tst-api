export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const type = searchParams.get('type');
  const query = searchParams.get('q');
  const webKey = process.env.FMCAS_WEBKEY; // put your real webKey here or env var

  if (!type || !query) {
    return new Response(
      JSON.stringify({ error: 'Missing required query parameters: type and q' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let url;
  switch (type.toLowerCase()) {
    case 'docket':
      url = `https://mobile.fmcsa.dot.gov/qc/services/carriers/docket-number/${encodeURIComponent(query)}?webKey=${encodeURIComponent(webKey)}`;
      break;
    case 'usdot':
      url = `https://mobile.fmcsa.dot.gov/qc/services/carriers/${encodeURIComponent(query)}?webKey=${encodeURIComponent(webKey)}`;
      break;
    case 'name':
      url = `https://mobile.fmcsa.dot.gov/qc/services/carriers/name/${encodeURIComponent(query)}?webKey=${encodeURIComponent(webKey)}`;
      break;
    default:
      return new Response(
        JSON.stringify({ error: `Invalid type parameter: ${type}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
  }

  try {
    const res = await fetch(url);

    if (!res.ok) {
      // FMCAS returned 404 or error
      return new Response(
        JSON.stringify({ error: `External API error: ${res.status}` }),
        { status: res.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await res.json();

    // Optional: Filter results if type=name to mimic Angular behavior
    if (type.toLowerCase() === 'name' && data.content) {
      const filtered = data.content.filter(item => item.carrier.allowedToOperate === 'Y');
      const carriers = filtered.map(item => item.carrier);
      return new Response(JSON.stringify({ carriers }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // For other types or no filtering needed, return raw data
    return new Response(JSON.stringify(type === 'docket' ? data.content[0].carrier : data.content.carrier), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
