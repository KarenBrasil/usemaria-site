const { calcularPrecoPrazo } = require('correios-brasil');

async function test() {
  let args = {
    sCepOrigem: '01310100', // Paulista
    sCepDestino: '60060390', // Fortaleza
    nVlPeso: '1',
    nCdFormato: '1',
    nVlComprimento: '20',
    nVlAltura: '20',
    nVlLargura: '20',
    nCdServico: ['04014', '04510'], // SEDEX, PAC
    nVlDiametro: '0',
  };

  try {
    const result = await calcularPrecoPrazo(args);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
  }
}

test();
