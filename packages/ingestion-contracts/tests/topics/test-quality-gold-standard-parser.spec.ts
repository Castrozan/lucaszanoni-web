import { describe, expect, it } from "vitest";
import { parseGoldStandardPractices } from "../../src/topics/test-quality/test-quality-gold-standard-parsers";

const CONTEXT = "dotfiles-test-quality payload gold standard practices";

const adoptedPractice = {
  practice: "rubric-graded-judging",
  adopted: true,
  measurement: 19,
  measurementUnit: "of 25 eval suites",
  evidence: "Responses are graded against a written rubric by a judge model.",
};

const unadoptedPractice = {
  practice: "repeated-sampling",
  adopted: false,
  measurement: 0,
  measurementUnit: "sampling epochs behind the committed baseline",
  evidence:
    "Rerunning every test across epochs turns one pass rate into a mean.",
};

function parseWith(practices: readonly unknown[]) {
  return parseGoldStandardPractices(
    { goldStandardPractices: practices },
    CONTEXT,
  );
}

describe("parseGoldStandardPractices", () => {
  it("keeps the practices the quality page renders", () => {
    const practices = parseWith([adoptedPractice, unadoptedPractice]);
    expect(practices.map((practice) => practice.practice)).toEqual([
      "rubric-graded-judging",
      "repeated-sampling",
    ]);
    expect(practices.map((practice) => practice.measurement)).toEqual([19, 0]);
    expect(practices.map((practice) => practice.adopted)).toEqual([
      true,
      false,
    ]);
  });

  it("accepts a fractional measurement so an agreement score survives", () => {
    const practices = parseWith([
      { ...adoptedPractice, practice: "judge-calibration", measurement: 0.833 },
    ]);
    expect(practices.map((practice) => practice.measurement)).toEqual([0.833]);
  });

  it("rejects a practice claiming adoption with nothing measured", () => {
    expect(() => parseWith([{ ...adoptedPractice, measurement: 0 }])).toThrow(
      /rubric-graded-judging/,
    );
  });

  it("accepts an unadopted practice measuring zero", () => {
    expect(
      parseWith([unadoptedPractice]).map((practice) => practice.measurement),
    ).toEqual([0]);
  });

  it("rejects the same practice reported twice", () => {
    expect(() => parseWith([adoptedPractice, adoptedPractice])).toThrow(
      /more than once/,
    );
  });

  it("rejects a practice name that is not a url safe label", () => {
    expect(() =>
      parseWith([{ ...adoptedPractice, practice: "Rubric Graded Judging" }]),
    ).toThrow(/practice/);
  });

  it("rejects an unknown property on a practice", () => {
    expect(() =>
      parseWith([{ ...adoptedPractice, sourceFile: "baseline.json" }]),
    ).toThrow(/sourceFile/);
  });

  it("rejects a negative measurement", () => {
    expect(() => parseWith([{ ...adoptedPractice, measurement: -1 }])).toThrow(
      /measurement/,
    );
  });

  it("rejects an empty practice list because the block would claim nothing", () => {
    expect(() => parseWith([])).toThrow(/goldStandardPractices/);
  });

  it("rejects a practice missing the evidence sentence the page renders", () => {
    const { evidence: _evidence, ...withoutEvidence } = adoptedPractice;
    expect(() => parseWith([withoutEvidence])).toThrow(/evidence/);
  });
});
