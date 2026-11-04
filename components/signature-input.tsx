"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useRef, useState } from "react";
import { MAX_SIGNATURE_DATA_LENGTH, type SignatureMark } from "@/lib/service-signature-content";

export default function SignatureInput({ value, onChange, name, disabled = false }: {
  value: SignatureMark; onChange: (value: SignatureMark) => void; name: string; disabled?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadSequence = useRef(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  function changeMethod(method: SignatureMark["method"]) {
    uploadSequence.current++; setLoading(false); setError(""); drawing.current = false;
    canvas.current?.getContext("2d")?.clearRect(0, 0, 1000, 300);
    onChange(method === "typed" ? { method } : { method, imageData: "" });
  }
  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * 1000 / rect.width, y: (event.clientY - rect.top) * 300 / rect.height };
  }
  function stroke(event: React.PointerEvent<HTMLCanvasElement>) {
    const context = canvas.current?.getContext("2d");
    if (!drawing.current || !last.current || !context) return;
    const next = point(event);
    context.lineWidth = 4; context.lineCap = "round"; context.strokeStyle = "#173d40";
    context.beginPath(); context.moveTo(last.current.x, last.current.y); context.lineTo(next.x, next.y); context.stroke(); last.current = next;
  }
  function finish(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !canvas.current) return;
    stroke(event); drawing.current = false; last.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    onChange({ method: "drawn", imageData: canvas.current.toDataURL("image/png") });
  }
  async function upload(file: File | undefined) {
    const sequence = ++uploadSequence.current;
    setError(""); onChange({ method: "uploaded", imageData: "" });
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 1024 * 1024) { setError("Choose a PNG or JPEG signature image up to 1 MB."); return; }
    setLoading(true);
    const url = URL.createObjectURL(file);
    try {
      const image = new window.Image(); image.src = url; await image.decode();
      if (image.naturalWidth > 6000 || image.naturalHeight > 6000) throw new Error("Use a signature image no larger than 6000 pixels per side.");
      const normalized = document.createElement("canvas"); normalized.width = 1000; normalized.height = 300;
      const context = normalized.getContext("2d"); if (!context) throw new Error("Unable to read this signature image.");
      const scale = Math.min(1000 / image.naturalWidth, 300 / image.naturalHeight);
      const width = image.naturalWidth * scale; const height = image.naturalHeight * scale;
      context.drawImage(image, (1000 - width) / 2, (300 - height) / 2, width, height);
      const pixels = context.getImageData(0, 0, 1000, 300).data;
      let ink = 0; for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3] > 30 && Math.min(pixels[i], pixels[i + 1], pixels[i + 2]) < 230) ink++;
      if (ink < 20) throw new Error("Choose an image with a visible signature.");
      const imageData = normalized.toDataURL("image/png");
      if (imageData.length > MAX_SIGNATURE_DATA_LENGTH) throw new Error("Use a simple signature image with a plain background.");
      if (sequence === uploadSequence.current) onChange({ method: "uploaded", imageData });
    } catch (error) { if (sequence === uploadSequence.current) setError(error instanceof Error ? error.message : "Unable to read this image."); }
    finally { URL.revokeObjectURL(url); if (sequence === uploadSequence.current) setLoading(false); }
  }
  return <fieldset disabled={disabled} className="space-y-3 disabled:opacity-60"><legend className="mb-3 text-sm font-semibold">Signature style</legend>
    <div className="flex flex-wrap gap-2">{([["typed", "Type name"], ["drawn", "Draw"], ["uploaded", "Upload image"]] as const).map(([method, label]) => <Button key={method} type="button" variant={value.method === method ? "default" : "outline"} aria-pressed={value.method === method} onClick={() => changeMethod(method)} className="h-auto min-h-10 rounded-lg px-4 py-2">{label}</Button>)}</div>
    {value.method === "typed" && <div className="rounded-lg border border-slate-200 bg-white p-5"><p className="font-serif text-2xl italic text-[#173d40]">{name || "Your name"}</p><p className="mt-2 text-xs text-slate-500">Your full name above will be used as your signature.</p></div>}
    {value.method === "drawn" && <><p className="text-sm text-slate-600">Draw your signature with a mouse, finger, or stylus.</p><canvas ref={canvas} width={1000} height={300} aria-label="Draw your signature" className="aspect-[10/3] h-auto w-full touch-none rounded-lg border border-slate-300 bg-white" onPointerDown={event => {
      if (disabled || (event.pointerType === "mouse" && event.button !== 0)) return;
      drawing.current = true; last.current = point(event); event.currentTarget.setPointerCapture(event.pointerId);
      const context = event.currentTarget.getContext("2d"); if (context) { context.fillStyle = "#173d40"; context.beginPath(); context.arc(last.current.x, last.current.y, 2, 0, Math.PI*2); context.fill(); }
    }} onPointerMove={stroke} onPointerUp={finish} onPointerCancel={finish} />
      <Button type="button" variant="link" className="h-auto p-0 text-sm" onClick={() => { canvas.current?.getContext("2d")?.clearRect(0, 0, 1000, 300); onChange({ method: "drawn", imageData: "" }); }}>Clear signature</Button></>}
    {value.method === "uploaded" && <><Label className="block leading-normal text-sm">Signature image (PNG or JPEG, up to 1 MB)<Input ref={fileInput} type="file" accept="image/png,image/jpeg" className="mt-2 block w-full text-sm" onChange={event => { void upload(event.target.files?.[0]); event.target.value = ""; }} /></Label>{loading && <p role="status" className="text-sm">Reading signature image…</p>}{value.imageData && <div className="rounded-lg border border-slate-200 bg-white p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={value.imageData} alt="Uploaded signature preview" className="max-h-44 w-full object-contain" />
    </div>}</>}
    {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
  </fieldset>;
}
