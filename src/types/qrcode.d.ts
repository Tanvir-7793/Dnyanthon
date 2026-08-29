declare module "qrcode" {
  const QRCode: {
    toDataURL(
      text: string,
      options?: {
        errorCorrectionLevel?: "L" | "M" | "Q" | "H";
        margin?: number;
        width?: number;
        color?: {
          dark?: string;
          light?: string;
        };
      },
    ): Promise<string>;
  };

  export default QRCode;
}
