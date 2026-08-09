/**
 * Utilitário para gerar Payload do PIX (BR Code)
 * Referência: Manual do BR Code (BACEN)
 */

function crc16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) > 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function formatField(id: string, value: string): string {
  const size = value.length.toString().padStart(2, '0');
  return `${id}${size}${value}`;
}

export function generatePixPayload({
  pixKey,
  merchantName,
  merchantCity = 'FORTALEZA',
  amount,
  transactionId = 'USEMARIA***'
}: {
  pixKey: string;
  merchantName: string;
  merchantCity?: string;
  amount: number;
  transactionId?: string;
}): string {
  // Remover caracteres especiais do nome e chave se necessário
  const cleanKey = pixKey.replace(/[^a-zA-Z0-9@.\-_]/g, '');
  // Formatar valor com 2 casas decimais e ponto
  const formattedAmount = amount.toFixed(2);

  const payloadFormatIndicator = formatField('00', '01');
  
  const merchantAccountInformation = formatField('26', 
    formatField('00', 'br.gov.bcb.pix') + 
    formatField('01', cleanKey)
  );
  
  const merchantCategoryCode = formatField('52', '0000');
  const transactionCurrency = formatField('53', '986'); // BRL
  const transactionAmount = formatField('54', formattedAmount);
  const countryCode = formatField('58', 'BR');
  const merchantNameField = formatField('59', merchantName.substring(0, 25).trim());
  const merchantCityField = formatField('60', merchantCity.substring(0, 15).trim());
  
  const additionalDataFieldTemplate = formatField('62', 
    formatField('05', transactionId)
  );

  const payload = 
    payloadFormatIndicator +
    merchantAccountInformation +
    merchantCategoryCode +
    transactionCurrency +
    transactionAmount +
    countryCode +
    merchantNameField +
    merchantCityField +
    additionalDataFieldTemplate +
    '6304'; // CRC start

  const crc = crc16(payload);
  
  return payload + crc;
}
