const textEncoder = new TextEncoder();

export const multibyteChar = '\u{1F984}';
export const multibyteString = `${multibyteChar}${multibyteChar}`;
export const multibyteUint8Array = textEncoder.encode(multibyteString);
export const breakingLength = multibyteUint8Array.length * 0.75;
export const brokenSymbol = '\uFFFD';
