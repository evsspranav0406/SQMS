
import { useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';

interface QRCodeProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  logoUrl?: string;
  logoWidth?: number;
  logoHeight?: number;
  cornerRadius?: number;
}

const QRCode = ({
  value,
  size = 200,
  bgColor = "#ffffff",
  fgColor = "#9b87f5",
  logoUrl,
  logoWidth = 60,
  logoHeight = 60,
  cornerRadius = 5
}: QRCodeProps) => {
  const qrRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!qrRef.current) return;

    const qrCode = new QRCodeStyling({
      width: size,
      height: size,
      type: "svg",
      data: value,
      dotsOptions: {
        color: fgColor,
        type: "rounded"
      },
      backgroundOptions: {
        color: bgColor,
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: fgColor
      },
      cornersDotOptions: {
        type: "dot",
        color: fgColor
      },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 10
      },
      qrOptions: {
        errorCorrectionLevel: "H"
      },
    });

    if (logoUrl) {
      qrCode.update({
        image: logoUrl,
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 10,
          imageSize: 0.3,
          hideBackgroundDots: true
        }
      });
    }

    qrRef.current.innerHTML = '';
    qrCode.append(qrRef.current);
  }, [value, size, bgColor, fgColor, logoUrl, logoWidth, logoHeight, cornerRadius]);

  return <div ref={qrRef} className="qr-code" />;
};

export default QRCode;
