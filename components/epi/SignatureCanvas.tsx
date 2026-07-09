"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export interface SignatureCanvasHandle {
  getDataUrl: () => string;
  clear: () => void;
  isEmpty: () => boolean;
}

/** Canvas de assinatura sem dependência externa (pointer/touch + devicePixelRatio). */
const SignatureCanvas = forwardRef<SignatureCanvasHandle, { height?: number; className?: string }>(
  function SignatureCanvas({ height = 180, className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const last = useRef<{ x: number; y: number } | null>(null);
    const [vazio, setVazio] = useState(true);

    // ajusta a resolução do canvas ao tamanho real (nitidez em telas retina)
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(ratio, ratio);
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#111827";
      }
    }, []);

    const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      drawing.current = true;
      last.current = pos(e);
      canvasRef.current?.setPointerCapture(e.pointerId);
    };
    const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawing.current) return;
      const ctx = canvasRef.current?.getContext("2d");
      const p = pos(e);
      if (ctx && last.current) {
        ctx.beginPath();
        ctx.moveTo(last.current.x, last.current.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        last.current = p;
        if (vazio) setVazio(false);
      }
    };
    const up = () => { drawing.current = false; last.current = null; };

    useImperativeHandle(ref, () => ({
      getDataUrl: () => canvasRef.current?.toDataURL("image/png") ?? "",
      clear: () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        setVazio(true);
      },
      isEmpty: () => vazio,
    }), [vazio]);

    return (
      <canvas
        ref={canvasRef}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        style={{ height, touchAction: "none" }}
        className={`w-full cursor-crosshair rounded-md border border-gray-300 bg-white ${className ?? ""}`}
      />
    );
  },
);

export default SignatureCanvas;
