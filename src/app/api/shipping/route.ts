import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { zipcode, weight = 1 } = await request.json();

    if (!zipcode) {
      return NextResponse.json({ error: 'CEP de destino não informado' }, { status: 400 });
    }

    const token = process.env.MELHOR_ENVIO_TOKEN;
    const originCep = process.env.STORE_CEP || '61760400';

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
            weight: weight,
            width: 20,
            height: 20,
            length: 20,
            insurance_value: 0
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
      }));

    return NextResponse.json({ options });
  } catch (error: any) {
    console.error('Erro na rota de shipping:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
