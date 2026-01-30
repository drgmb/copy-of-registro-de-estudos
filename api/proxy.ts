import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { scriptUrl, action, data, method = 'GET', ...params } = req.body;

    if (!scriptUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'scriptUrl is required'
      });
    }

    // Construir URL com query params
    const url = new URL(scriptUrl);
    if (action) {
      url.searchParams.append('action', action);
    }

    // Adicionar parâmetros extras
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    // Fazer requisição para Google Apps Script
    let fetchOptions: RequestInit = {
      method: method,
      redirect: 'follow', // Seguir redirects automaticamente
    };

    // Se for POST e tiver dados, enviar como form data
    if (method === 'POST' && data) {
      const formData = new URLSearchParams();
      if (typeof data === 'string') {
        formData.append('data', data);
      } else {
        Object.keys(data).forEach(key => {
          formData.append(key, typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);
        });
      }

      fetchOptions.body = formData;
      fetchOptions.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
    }

    const response = await fetch(url.toString(), fetchOptions);
    const responseData = await response.json();

    return res.status(200).json(responseData);

  } catch (error: any) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
}
