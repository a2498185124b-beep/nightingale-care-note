import { assertRedacted, redactBeforeModel } from "./redaction";

export function prepareModelRequest(rawText: string) {
  const redacted = redactBeforeModel(rawText);
  assertRedacted(redacted);
  return {
    payload: redacted.text,
    redactionCount: redacted.replacements.length,
    policy: "pre_llm_redaction_v1",
  };
}

