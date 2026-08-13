import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { zipcode, weight = 0.3, insuranceValue = 0 } = await request.json();

    if (!zipcode) {
      return NextResponse.json({ error: 'CEP de destino não informado' }, { status: 400 });
    }
    const token = process.env.MELHOR_ENVIO_TOKEN || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiOThiYjg1N2RjM2MzNTIzZDQ1NjNiZmNlY2U5ZDlhMjM0NTBkYjAzN2EzZTZmMGVlYjQzMDdhMTEyZGZiMThmZDI1ODlhNzY2MmI1MTZjNzQiLCJpYXQiOjE3ODUyMTA1NTMuNjQ2NDA4LCJuYmYiOjE3ODUyMTA1NTMuNjQ2NDExLCJleHAiOjE4MTY3NDY1NTMuNjMxOTE4LCJzdWIiOiJhMjU2OGVhYS1kM2VjLTRjYzYtOThjOC02MjJiZGZlOWI0YzEiLCJzY29wZXMiOlsic2hpcHBpbmctY2FsY3VsYXRlIiwic2hpcHBpbmctY29tcGFuaWVzIiwic2hpcHBpbmctdHJhY2tpbmciLCJjYXJ0LXJlYWQiLCJjYXJ0LXdyaXRlIiwiZWNvbW1lcmNlLXNoaXBwaW5nIl19.XywC3aBRiUqWaaRUY25zU1OBN4GnuXsUYyE9VrzTlQjtHU93o-k_C4mkIG8vq6dnP7vzN51hERCYfiw1WuY_RHkALuZKcKuNYwCCDF-doltRv6l3OQSzQHBskSRESMB-fcfn7aIC7jUuXLg2HCH152meeiq8F9tDrslEhlkA-Zv1p_hGum6bfTHGJ_X77MAIZa1Sgj8iobMAZdPEYh6rCDUNjlwa3kH5A3U5_gYvUkz8Ms_P9YmJUrgkSg5HiCQw015pTblAXBPQVdYldRvgDKFpSeiNp1G-8sF4KmqvJR_3_QAvqbB09x7KtftYa4MKOcCtTttXMv1vSmPwoif97KuIpuXm4-fx8PvzGAoqwBarVRhfR-MzixjQl_DU572q8-jOdH8_IZXapMfAmaQY6Ca6P-DP1y4Xv23pv3RtoL15RHHEF8Dhq4odVlRl0DuGYUgmmUdHKJFtlaNH5G1TcjSEOT1GszJ9hE64JHpBRazkxxmn-5X0oLoJadOsUxvpqss51fbngoWPKmeDLj5eY6buMaVGEWX_JzEfRA7o86dL_KZ2kbl94hoqKtpBhvup48OiusvsCzYbU2lYP_io6Zo-FoWJjIkYzocNBT_V8YiDH1VUpLNjMhFZ10rd3USEzFHvW516dIRHnVXSjRSUPsWgSzH6dgflpKtxKLImHos';
    const originCep = process.env.STORE_CEP || '60811660';

    if (!token) {
      return NextResponse.json({ error: 'Token do Melhor Envio não configurado' }, { status: 500 });
    }

    // Usando API v2 do Melhor Envio
    const response = await fetch('https://www.melhorenvio.com.br/api/v2/me/shipment/calculate', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Use Maria Store (karenmsb1@gmail.com)'
      },
      body: JSON.stringify({
        from: {
          postal_code: originCep
        },
        to: {
          postal_code: zipcode.replace(/\D/g, '')
        },
        products: [
          {
            id: '1',
            weight: weight || 0.3,
            width: 22,
            height: 6,
            length: 27,
            insurance_value: insuranceValue
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Melhor Envio API Error:', errorData);
      return NextResponse.json({ error: 'Erro ao consultar Melhor Envio' }, { status: response.status });
    }

    const data = await response.json();
    
    // Filtrar apenas Correios (PAC e SEDEX) ou outras transportadoras desejadas
    // No Melhor Envio: 1 = PAC, 2 = SEDEX (Normalmente)
    const options = data
      .filter((option: any) => !option.error)
      .map((option: any) => ({
        id: option.id,
        name: option.name,
        company: option.company.name,
        price: parseFloat(option.custom_price || option.price),
        delivery_time: option.custom_delivery_time || option.delivery_time,
        currency: option.currency
      }))
      .sort((a: any, b: any) => a.price - b.price)
      .slice(0, 3);

    // Adiciona Retirada/Uber para a mesma cidade (Fortaleza - prefixos 60 e 61)
    const cepClean = zipcode.replace(/\D/g, '');
    if (cepClean.startsWith('60') || cepClean.startsWith('61')) {
      options.unshift({
        id: 'uber-pickup',
        name: 'Retirada por Uber / Combinar via WhatsApp',
        company: 'Use Maria',
        price: 0,
        delivery_time: 0, // 0 indicando o mais rápido possível
        currency: 'BRL'
      });
    }

    return NextResponse.json({ options });
  } catch (error: any) {
    console.error('Erro na rota de shipping:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
