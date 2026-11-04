import { parseSignatureMark, type SignatureMark } from "@/lib/service-signature-content";

export default function SignatureDisplay({ name, mark, role }: { name: string; mark?: SignatureMark; role: "Chef" | "Client" }) {
  let parsed: SignatureMark;
  try { parsed = parseSignatureMark(mark); } catch { return <p className="mt-3 text-sm">Signature image unavailable. Contact Chef Amber.</p>; }
  return parsed.method === "typed" ? <p className="mt-3 font-serif text-2xl italic">{name}</p> : <div className="mt-3">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={parsed.imageData} alt={`${role} ${parsed.method === "drawn" ? "drawn" : "uploaded"} signature`} className="max-h-28 max-w-full object-contain object-left" />
    <p className="mt-2 text-sm">{name} · {parsed.method === "drawn" ? "Drawn signature" : "Uploaded signature"}</p>
  </div>;
}
