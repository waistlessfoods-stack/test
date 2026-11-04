import { PNG } from "pngjs";
import { parseSignatureMark, type SignatureMark } from "@/lib/service-signature-content";
import { ServiceInvoiceError } from "@/lib/service-invoice-content";

export function validateSignatureMark(value: unknown): SignatureMark {
  try {
    const mark = parseSignatureMark(value);
    if (mark.method === "typed") return mark;
    const bytes = Buffer.from(mark.imageData.split(",")[1], "base64");
    if (bytes.length < 33 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" || bytes.toString("ascii", 12, 16) !== "IHDR") throw new Error();
    // Bound dimensions before decoding; normalized browser canvases are 1000x300.
    const width = bytes.readUInt32BE(16); const height = bytes.readUInt32BE(20);
    if (width < 1 || height < 1 || width > 1200 || height > 400 || width * height > 480000 || bytes[24] !== 8 || ![2, 6].includes(bytes[25]) || bytes[28] !== 0) throw new Error();
    let headers = 0;
    for (let offset = 8; offset < bytes.length;) {
      if (offset + 12 > bytes.length) throw new Error();
      const length = bytes.readUInt32BE(offset);
      if (offset + length + 12 > bytes.length) throw new Error();
      if (bytes.toString("ascii", offset + 4, offset + 8) === "IHDR") headers++;
      offset += length + 12;
    }
    if (headers !== 1) throw new Error();
    const image = PNG.sync.read(bytes, { checkCRC: true });
    let ink = 0;
    for (let index = 0; index < image.data.length; index += 4) {
      if (image.data[index + 3] > 30 && Math.min(image.data[index], image.data[index + 1], image.data[index + 2]) < 230) ink++;
    }
    if (ink < 20) throw new Error("The signature image is blank. Draw or upload a visible signature.");
    // Strip metadata and other PNG chunks before storing or displaying the image.
    const clean = PNG.sync.write(image, { colorType: 6 });
    const imageData = `data:image/png;base64,${clean.toString("base64")}`;
    return parseSignatureMark({ method: mark.method, imageData });
  } catch (error) {
    const message = error instanceof Error && error.message.startsWith("The signature image is blank") ? error.message : "Use a valid, non-blank signature image (PNG or JPEG, up to 1 MB).";
    throw new ServiceInvoiceError(message);
  }
}
