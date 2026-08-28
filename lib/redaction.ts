export type RedactionResult = {
  text: string;
  replacements: Array<{ type: "NAME" | "PHONE" | "ID" | "EMAIL"; placeholder: string; original: string }>;
  remainingSuspects: string[];
  policyVersion: "pre_llm_redaction_v2";
};

export type RedactionContext = { knownNames?: string[] };

const basePatterns: Array<{ type: RedactionResult["replacements"][number]["type"]; expression: RegExp }> = [
  { type: "EMAIL", expression: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { type: "PHONE", expression: /(?<!\d)(?:\+?65[ -]?)?[689]\d{3}[ -]?\d{4}(?!\d)/g },
  { type: "ID", expression: /\b[STFGM]\d{7}[A-Z]\b/gi },
  { type: "NAME", expression: /\b(?:Ms|Mr|Mrs|Dr)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g },
];

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function patternsFor(context: RedactionContext) {
  const knownNames = (context.knownNames ?? []).filter(Boolean);
  return knownNames.length
    ? [...basePatterns, { type: "NAME" as const, expression: new RegExp(`\\b(?:${knownNames.map(escapeRegex).join("|")})\\b`, "gi") }]
    : basePatterns;
}

export function redactBeforeModel(input: string, context: RedactionContext = {}): RedactionResult {
  let text = input;
  const replacements: RedactionResult["replacements"] = [];
  const counters: Record<string, number> = {};
  const patterns = patternsFor(context);
  for (const { type, expression } of patterns) {
    expression.lastIndex = 0;
    text = text.replace(expression, (original) => {
      counters[type] = (counters[type] ?? 0) + 1;
      const placeholder = `[${type}_${counters[type]}]`;
      replacements.push({ type, placeholder, original });
      return placeholder;
    });
  }
  const remainingSuspects: string[] = [];
  for (const { expression } of patterns) {
    expression.lastIndex = 0;
    remainingSuspects.push(...(text.match(expression) ?? []));
  }
  return { text, replacements, remainingSuspects, policyVersion: "pre_llm_redaction_v2" };
}

export function assertRedacted(result: RedactionResult) {
  if (result.remainingSuspects.length > 0) throw new Error("Redaction failed closed: identifier remains");
}
