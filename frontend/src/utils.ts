export function extractToolArg(inputSummary: string): string {
  try {
    const input = JSON.parse(inputSummary);
    const last = (p: string) => p.replace(/\\/g, "/").split("/").pop() ?? p;
    if (typeof input.file_path === "string") return last(input.file_path);
    if (typeof input.pattern === "string") return input.pattern;
    if (typeof input.command === "string") return input.command;
    if (typeof input.query === "string") return input.query;
    if (typeof input.name === "string") return input.name;
    if (typeof input.prompt === "string") return input.prompt.slice(0, 40);
    const first = Object.values(input)[0];
    return String(first ?? "").slice(0, 40);
  } catch {
    return inputSummary.slice(0, 40);
  }
}
