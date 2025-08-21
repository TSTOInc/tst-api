import { NextResponse } from 'next/server';

function createCorsResponse(data, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set('Access-Control-Allow-Origin', '*'); // Adjust to your domain in production
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return res;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const type = searchParams.get('type');
  const query = searchParams.get('q');
  const webKey = process.env.FMCAS_WEBKEY;

  if (!type || !query) {
    return createCorsResponse({ error: 'Missing required query parameters: type and q' }, 400);
  }

  if (!webKey) {
    return createCorsResponse({ error: 'Missing FMCAS_WEBKEY environment variable' }, 500);
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
      return createCorsResponse({ error: `Invalid type parameter: ${type}` }, 400);
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return createCorsResponse({ error: `External API error: ${res.status}` }, res.status);
    }

    const data = await res.json();

    // If we have a USDOT response, fetch docket numbers if available
    if ((type.toLowerCase() === 'usdot' || type.toLowerCase() === 'name') && data.content && data.content.carrier) {
      const carrier = data.content.carrier;

      // Check if a docket numbers link exists
      const docketUrl = data.content._links?.['docket numbers']?.href;
      if (docketUrl) {
        try {
          const docketRes = await fetch(docketUrl);
          if (docketRes.ok) {
            const docketData = await docketRes.json();
            // Append docket numbers to the carrier object
            carrier.docketNumbers = docketData?.content || [];
          } else {
            carrier.docketNumbers = [];
          }
        } catch {
          carrier.docketNumbers = [];
        }
      } else {
        carrier.docketNumbers = [];
      }

      return createCorsResponse({ content: { ...data.content, carrier } });
    }

    // For 'name' type filtering
    if (type.toLowerCase() === 'name' && Array.isArray(data.content)) {
      const filtered = data.content.filter(item => item.carrier.allowedToOperate === 'Y');
      const carriers = filtered.map(item => item.carrier);
      return createCorsResponse({ carriers });
    }

    return createCorsResponse(data);
  } catch (error) {
    return createCorsResponse({ error: error.message }, 500);
  }
}
