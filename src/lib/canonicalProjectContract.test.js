import { describe, expect, it } from "vitest";
import {
  MAT_SOURCE_VALUES,
  validateCanonicalProjectPayload,
} from "./canonicalProjectContract.js";

function buildPayloadWithMatLine(matLine = {}) {
  return {
    version: "v1",
    project: { client_nom: "Client Test" },
    lots: [
      {
        lot_key: "lot_test",
        title: "Lot Test",
        metiers: [
          {
            metier_key: "plomberie",
            name: "Plombier",
            mat_lines: [
              {
                line_key: "ligne_test",
                label: "Materiau test",
                avec_unite: true,
                q_base: 1,
                d_base: "1 u",
                props: [
                  {
                    name: "Option test",
                    std: { lo: 10, sug: 15, hi: 20 },
                    mid: { lo: 15, sug: 20, hi: 30 },
                    sup: { lo: 25, sug: 35, hi: 45 },
                  },
                ],
                ...matLine,
              },
            ],
          },
        ],
      },
    ],
  };
}

describe("canonicalProjectContract", () => {
  it("normalizes mat_source to catalog when absent", () => {
    const payload = validateCanonicalProjectPayload(buildPayloadWithMatLine());

    expect(payload.lots[0].metiers[0].mat_lines[0].mat_source).toBe("catalog");
  });

  it("accepts each allowed mat_source value", () => {
    MAT_SOURCE_VALUES.forEach((value) => {
      const payload = validateCanonicalProjectPayload(buildPayloadWithMatLine({ mat_source: value }));
      expect(payload.lots[0].metiers[0].mat_lines[0].mat_source).toBe(value);
    });
  });

  it("rejects an unknown mat_source value", () => {
    expect(() =>
      validateCanonicalProjectPayload(buildPayloadWithMatLine({ mat_source: "hallucine" }))
    ).toThrow("mat_source is invalid");
  });
});
