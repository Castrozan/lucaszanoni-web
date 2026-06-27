import { tool } from "ai";
import { z } from "zod";

export const displayDynamicFormToolOutputSchema = z.object({
  title: z.string(),
  description: z.string(),
  fields: z.array(
    z.object({
      fieldName: z.string(),
      fieldLabel: z.string(),
      fieldType: z.enum(["text", "email", "number", "textarea", "select", "checkbox"]),
      placeholder: z.string(),
      required: z.boolean(),
      options: z.array(z.string()).optional(),
    }),
  ),
  submitButtonLabel: z.string(),
});

export type DisplayDynamicFormToolOutput = z.infer<
  typeof displayDynamicFormToolOutputSchema
>;

export const displayDynamicFormTool = tool({
  description:
    "Display a dynamic form for collecting user input. Use when the user needs to fill in information, submit data, create records, sign up, configure settings, or provide feedback.",
  inputSchema: z.object({
    purpose: z.string().describe("What the form is for (e.g., 'contact us', 'user registration', 'feedback')"),
    fields: z
      .array(
        z.object({
          name: z.string(),
          type: z.enum(["text", "email", "number", "textarea", "select", "checkbox"]),
          label: z.string(),
          required: z.boolean().optional(),
          options: z.array(z.string()).optional(),
        }),
      )
      .describe("Fields to include in the form")
      .optional(),
  }),
  execute: async function ({ purpose, fields }) {
    const resolvedFields = fields ?? inferFieldsFromPurpose(purpose);

    return {
      title: generateFormTitleFromPurpose(purpose),
      description: `Please fill in the following information for ${purpose.toLowerCase()}.`,
      fields: resolvedFields.map((field) => ({
        fieldName: field.name.toLowerCase().replace(/\s+/g, "_"),
        fieldLabel: field.label,
        fieldType: field.type,
        placeholder: `Enter ${field.label.toLowerCase()}...`,
        required: field.required ?? true,
        options: "options" in field ? field.options : undefined,
      })),
      submitButtonLabel: generateSubmitLabelFromPurpose(purpose),
    };
  },
});

function inferFieldsFromPurpose(purpose: string) {
  const purposeLower = purpose.toLowerCase();

  if (purposeLower.includes("contact")) {
    return [
      { name: "name", type: "text" as const, label: "Full Name", required: true },
      { name: "email", type: "email" as const, label: "Email Address", required: true },
      { name: "subject", type: "text" as const, label: "Subject", required: true },
      { name: "message", type: "textarea" as const, label: "Message", required: true },
    ];
  }

  if (purposeLower.includes("register") || purposeLower.includes("sign up")) {
    return [
      { name: "username", type: "text" as const, label: "Username", required: true },
      { name: "email", type: "email" as const, label: "Email", required: true },
      { name: "role", type: "select" as const, label: "Role", required: true, options: ["Developer", "Designer", "Manager", "Other"] },
      { name: "terms", type: "checkbox" as const, label: "I agree to the terms", required: true },
    ];
  }

  if (purposeLower.includes("feedback") || purposeLower.includes("survey")) {
    return [
      { name: "rating", type: "select" as const, label: "Rating", required: true, options: ["1 - Poor", "2 - Fair", "3 - Good", "4 - Great", "5 - Excellent"] },
      { name: "comments", type: "textarea" as const, label: "Comments", required: false },
      { name: "recommend", type: "checkbox" as const, label: "Would recommend to others", required: false },
    ];
  }

  return [
    { name: "name", type: "text" as const, label: "Name", required: true },
    { name: "details", type: "textarea" as const, label: "Details", required: true },
  ];
}

function generateFormTitleFromPurpose(purpose: string): string {
  return purpose
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function generateSubmitLabelFromPurpose(purpose: string): string {
  const purposeLower = purpose.toLowerCase();
  if (purposeLower.includes("contact")) return "Send Message";
  if (purposeLower.includes("register") || purposeLower.includes("sign up")) return "Create Account";
  if (purposeLower.includes("feedback")) return "Submit Feedback";
  return "Submit";
}
