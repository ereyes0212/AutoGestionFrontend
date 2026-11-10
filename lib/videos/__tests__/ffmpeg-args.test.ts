import { describe, expect, it } from "vitest";
import {
  argumentosConversion,
  argumentosPortada,
  dimensionesSalida,
  FORMATOS_ENTRADA,
  rotacionDe,
  segundoPortada,
} from "../ffmpeg-args";

describe("dimensionesSalida", () => {
  it("reduce un 1080p horizontal a 720p", () => {
    expect(dimensionesSalida({ width: 1920, height: 1080 })).toEqual({ ancho: 1280, alto: 720 });
  });

  it("reduce un vertical de iPhone manteniendo la proporción", () => {
    expect(dimensionesSalida({ width: 1320, height: 2868 })).toEqual({ ancho: 720, alto: 1564 });
  });

  it("nunca agranda videos pequeños", () => {
    expect(dimensionesSalida({ width: 384, height: 848 })).toEqual({ ancho: 384, alto: 848 });
  });

  it("aplica la rotación del celular (video grabado vertical guardado horizontal)", () => {
    const pista = { width: 1920, height: 1080, side_data_list: [{ rotation: -90 }] };
    expect(dimensionesSalida(pista)).toEqual({ ancho: 720, alto: 1280 });
  });

  it("entiende el tag antiguo 'rotate'", () => {
    expect(dimensionesSalida({ width: 1920, height: 1080, tags: { rotate: "90" } })).toEqual({ ancho: 720, alto: 1280 });
  });

  it("siempre devuelve dimensiones pares", () => {
    const { ancho, alto } = dimensionesSalida({ width: 1001, height: 777 });
    expect(ancho % 2).toBe(0);
    expect(alto % 2).toBe(0);
  });

  it("falla si el video no trae dimensiones", () => {
    expect(() => dimensionesSalida({})).toThrow();
  });
});

describe("rotacionDe", () => {
  it("0 si no hay datos", () => {
    expect(rotacionDe({})).toBe(0);
  });
  it("prefiere side_data sobre el tag", () => {
    expect(rotacionDe({ side_data_list: [{}, { rotation: 180 }], tags: { rotate: "90" } })).toBe(180);
  });
});

describe("segundoPortada", () => {
  it("1 s para videos normales", () => expect(segundoPortada(39.3)).toBe(1));
  it("la mitad para videos de menos de 2 s", () => expect(segundoPortada(1)).toBe(0.5));
  it("0 si no se conoce la duración", () => expect(segundoPortada(NaN)).toBe(0));
});

describe("entrada segura", () => {
  const casos = {
    conversion: argumentosConversion({ entrada: "in", salida: "out.mp4", ancho: 720, alto: 1280 }),
    portada: argumentosPortada({ entrada: "v.mp4", salida: "p.jpg", segundo: 1 }),
  };

  it.each(Object.entries(casos))("%s: lista blanca de formatos y protocolos antes de -i", (_n, args) => {
    const i = args.indexOf("-i");
    expect(args.indexOf("-format_whitelist")).toBeGreaterThan(-1);
    expect(args.indexOf("-format_whitelist")).toBeLessThan(i);
    expect(args.indexOf("-protocol_whitelist")).toBeLessThan(i);
    expect(args[args.indexOf("-protocol_whitelist") + 1]).toBe("file");
  });

  it("no acepta HLS ni concat", () => {
    const formatos = FORMATOS_ENTRADA.split(",");
    expect(formatos).toContain("mov");
    expect(formatos).not.toContain("hls");
    expect(formatos).not.toContain("concat");
  });
});

describe("argumentos de ffmpeg", () => {
  it("conversión: H.264 + AAC, faststart y la escala calculada", () => {
    const args = argumentosConversion({ entrada: "in", salida: "out.mp4", ancho: 720, alto: 1280 });
    expect(args).toEqual(expect.arrayContaining(["libx264", "yuv420p", "aac", "+faststart", "scale=720:1280"]));
    expect(args.slice(args.indexOf("-map"), args.indexOf("-map") + 4)).toEqual(["-map", "0:v:0", "-map", "0:a:0?"]);
    expect(args.at(-1)).toBe("out.mp4");
  });

  it("conversión: 1 hilo por defecto, para decodificar y codificar", () => {
    const args = argumentosConversion({ entrada: "in", salida: "out.mp4", ancho: 720, alto: 1280 });
    const i = args.indexOf("-i");
    expect(args.slice(i - 2, i)).toEqual(["-threads", "1"]);
    expect(args.slice(i + 2, i + 4)).toEqual(["-threads", "1"]);
  });

  it("conversión: respeta los hilos configurados y nunca baja de 1", () => {
    expect(argumentosConversion({ entrada: "in", salida: "o", ancho: 2, alto: 2, hilos: 4 })).toContain("4");
    const cero = argumentosConversion({ entrada: "in", salida: "o", ancho: 2, alto: 2, hilos: 0 });
    expect(cero[cero.indexOf("-threads") + 1]).toBe("1");
  });

  it("portada: un solo fotograma en el segundo indicado", () => {
    const args = argumentosPortada({ entrada: "v.mp4", salida: "p.jpg", segundo: 1 });
    expect(args).toEqual(expect.arrayContaining(["-ss", "1", "-frames:v", "1"]));
    expect(args.at(-1)).toBe("p.jpg");
  });
});
