import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { zipcode, weight = 0.3, insuranceValue = 0 } = await request.json();

    if (!zipcode) {
      return NextResponse.json({ error: 'CEP de destino não informado' }, { status: 400 });
    }

    const cepClean = zipcode.replace(/\D/g, '');
    const options: any[] = [];

    // Opções Manuais (Sempre disponíveis para o Ceará - Prefixo 6)
    if (cepClean.startsWith('6')) {
      options.push({
        id: 'retirada-loja',
        name: 'Retirada em Loja (Fortaleza-CE)',
        company: 'Físico',
        price: 0,
        delivery_time: 0,
        currency: 'BRL'
      });

      // Uber Moto apenas para Fortaleza e RMF (Prefixos 60 e 61)
      if (cepClean.startsWith('60') || cepClean.startsWith('61')) {
        options.push({
          id: 'uber-pickup',
          name: 'Envio por Motoboy/Uber (Valor a combinar no WhatsApp)',
          company: 'Motoboy',
          price: 0,
          delivery_time: 0,
          currency: 'BRL'
        });
      }
    }

    const token = process.env.MELHOR_ENVIO_TOKEN;
    const originCep = process.env.STORE_CEP || '60811660';

    if (token) {
      try {
        const response = await fetch('https://www.melhorenvio.com.br/api/v2/me/shipment/calculate', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'Use Maria Store (karenmsb1@gmail.com)'
          },
          body: JSON.stringify({
            from: { postal_code: originCep },
            to: { postal_code: cepClean },
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

        if (response.ok) {
          const data = await response.json();
          const meOptions = data
            .filter((option: any) => !option.error)
            .map((option: any) => ({
              id: option.id.toString(), // Ensure ID is string to match DB expectations
              name: option.name,
              company: option.company.name,
              price: parseFloat(option.custom_price || option.price),
              delivery_time: option.custom_delivery_time || option.delivery_time,
              currency: option.currency
            }))
            .sort((a: any, b: any) => a.price - b.price)
            .slice(0, 3);
            
          options.push(...meOptions);
        } else {
          console.error('Melhor Envio API Error:', await response.text());
        }
      } catch (meError) {
        console.error('Failed to fetch from Melhor Envio:', meError);
      }
    }

    // Se não tiver nenhuma opção (nem manual, nem ME), retorna erro
    if (options.length === 0) {
      return NextResponse.json({ error: 'Nenhuma opção de frete disponível para este CEP' }, { status: 404 });
    }

    return NextResponse.json({ options });
  } catch (error: any) {
    console.error('Erro na rota de shipping:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
