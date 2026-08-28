import { assertRedacted, redactBeforeModel, type RedactionContext } from "./redaction";

export const clinicalExtractionSchema = {
  type: "object",
  properties: {
    claims: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          source_quote: { type: "string" },
          source_start: { type: "integer" },
          source_end: { type: "integer" },
          entity_class: { type: "string", enum: ["allergy", "medication", "dose", "symptom", "task", "other"] },
        },
        required: ["label", "source_quote", "source_start", "source_end", "entity_class"],
        additionalProperties: false,
      },
    },
    abstain_reason: { type: ["string", "null"] },
  },
  required: ["claims", "abstain_reason"],
  additionalProperties: false,
} as const;

export function prepareModelRequest(rawText: string, context: RedactionContext = {}) {
  const redacted = redactBeforeModel(rawText, context);
  assertRedacted(redacted);
  return {
    payload: redacted.text,
    redactionCount: redacted.replacements.length,
    policy: redacted.policyVersion,
    mode: "extraction" as const,
    verification: "Every returned quote and offset must match the redacted payload; otherwise abstain.",
    openAIResponsesRequest: {
      model: "gpt-5.6",
      store: false,
      input: [
        { role: "system", content: "Extract only explicitly stated clinical facts. Copy exact source spans. Do not paraphrase. If an exact span cannot support a claim, omit it and set abstain_reason." },
        { role: "user", content: redacted.text },
      ],
      text: { format: { type: "json_schema", name: "clinical_fact_extraction", strict: true, schema: clinicalExtractionSchema } },
    },
  };
}
