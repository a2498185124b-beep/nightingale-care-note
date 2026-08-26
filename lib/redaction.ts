export type RedactionResult = {
  text: string;
  replacements: Array<{ type: "NAME" | "PHONE" | "ID" | "EMAIL"; placeholder: string }>;
};

const patterns: Array<{ type: RedactionResult["replacements"][number]["type"]; expression: RegExp }> = [
  { type: "EMAIL", expression: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { type: "PHONE", expression: /(?<!\d)(?:\+?65[ -]?)?[689]\d{3}[ -]?\d{4}(?!\d)/g },
  { type: "ID", expression: /\b[STFGM]\d{7}[A-Z]\b/gi },
  { type: "NAME", expression: /\b(?:Ms|Mr|Mrs|Dr)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g },
];

export function redactBeforeModel(input: string): RedactionResult {
  let text = input;
  const replacements: RedactionResult["replacements"] = [];
  const counters: Record<string, number> = {};
  for (const { type, expression } of patterns) {
    text = text.replace(expression, () => {
      counters[type] = (counters[type] ?? 0) + 1;
      const placeholder = `[${type}_${counters[type]}]`;
      replacements.push({ type, placeholder });
      return placeholder;
    });
  }
  return { text, replacements };
}

export function assertRedacted(result: RedactionResult) {
  for (const { expression } of patterns) {
    expression.lastIndex = 0;
    if (expression.test(result.text)) throw new Error("Redaction failed closed: identifier remains");
  }
}

