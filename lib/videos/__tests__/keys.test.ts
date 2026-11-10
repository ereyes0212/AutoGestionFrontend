import { describe, expect, it } from "vitest";
import { claveOriginal, clavePoster, claveVideoMp4, esIdVideoValido, normalizarPrefijo } from "../keys";

const ID = "84ae641e-7298-42f5-9f5a-93e2e41e6dfd";

describe("claves de S3", () => {
  it("originales y convertidos quedan en carpetas separadas dentro del prefijo", () => {
    expect(claveOriginal("videos", ID)).toBe(`videos/originales/${ID}`);
    expect(claveVideoMp4("videos", ID)).toBe(`videos/convertidos/${ID}/video.mp4`);
    expect(clavePoster("videos", ID)).toBe(`videos/convertidos/${ID}/poster.jpg`);
  });

  it("tolera barras de más en el prefijo", () => {
    expect(normalizarPrefijo(" /videos/ ")).toBe("videos");
    expect(claveOriginal("/videos/", ID)).toBe(`videos/originales/${ID}`);
    expect(claveVideoMp4("media/videos", ID)).toBe(`media/videos/convertidos/${ID}/video.mp4`);
  });
});

describe("esIdVideoValido", () => {
  it("acepta UUID", () => expect(esIdVideoValido(ID)).toBe(true));
  it("rechaza otras cosas", () => {
    expect(esIdVideoValido("../x")).toBe(false);
    expect(esIdVideoValido(`${ID}/../../`)).toBe(false);
    expect(esIdVideoValido(123)).toBe(false);
  });
});
