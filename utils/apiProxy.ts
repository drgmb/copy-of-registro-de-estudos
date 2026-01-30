// Utilitário para fazer requisições via proxy da Vercel, evitando CORS

const PROXY_URL = '/api/proxy';

interface ProxyRequestOptions {
  scriptUrl: string;
  action?: string;
  method?: 'GET' | 'POST';
  data?: any;
  params?: Record<string, any>;
}

export async function proxyRequest(options: ProxyRequestOptions): Promise<any> {
  const { scriptUrl, action, method = 'GET', data, params = {} } = options;

  const body = {
    scriptUrl,
    action,
    method,
    data,
    ...params
  };

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Proxy request failed: ${response.statusText}`);
  }

  return response.json();
}

// Funções específicas para cada tipo de requisição

export async function getFromGoogleScript(scriptUrl: string, action: string, params?: Record<string, any>): Promise<any> {
  return proxyRequest({
    scriptUrl,
    action,
    method: 'GET',
    params
  });
}

export async function postToGoogleScript(scriptUrl: string, action: string, data: any): Promise<any> {
  return proxyRequest({
    scriptUrl,
    action,
    method: 'POST',
    data
  });
}
