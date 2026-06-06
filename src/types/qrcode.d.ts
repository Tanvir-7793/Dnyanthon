declare module "qrcode" {
  const QRCode: {
    toDataURL(
      text: string,
      options?: {
        errorCorrectionLevel?: "L" | "M" | "Q" | "H";
        margin?: number;
        width?: number;
      },
    ): Promise<string>;
  };

  export default QRCode;
}
