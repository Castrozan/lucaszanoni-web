import { useState } from "react";
import type { DisplayDynamicFormToolOutput } from "@/intent/tools/display-dynamic-form-tool";

export function DynamicFormDisplay({
  title,
  description,
  fields,
  submitButtonLabel,
}: DisplayDynamicFormToolOutput) {
  const [formValues, setFormValues] = useState<
    Record<string, string | boolean>
  >(
    Object.fromEntries(
      fields.map((field) => [
        field.fieldName,
        field.fieldType === "checkbox" ? false : "",
      ]),
    ),
  );
  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleFieldValueChange(fieldName: string, value: string | boolean) {
    setFormValues((previous) => ({ ...previous, [fieldName]: value }));
  }

  function handleFormSubmission(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitted(true);
  }

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md rounded-lg border border-green-500/30 bg-green-900/10 p-6 text-center">
        <p className="text-sm font-medium text-green-400">
          Form submitted successfully
        </p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="text-muted-foreground hover:text-foreground mt-3 text-xs underline"
        >
          Submit another response
        </button>
      </div>
    );
  }

  return (
    <div className="border-border w-full max-w-md overflow-hidden rounded-lg border">
      <div className="border-border border-b px-4 py-3">
        <h3 className="text-foreground text-sm font-medium">{title}</h3>
        <p className="text-muted-foreground mt-1 text-xs">{description}</p>
      </div>

      <form onSubmit={handleFormSubmission} className="space-y-4 p-4">
        {fields.map((field) => (
          <DynamicFormField
            key={field.fieldName}
            field={field}
            value={formValues[field.fieldName]}
            onValueChange={(value) =>
              handleFieldValueChange(field.fieldName, value)
            }
          />
        ))}

        <button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          {submitButtonLabel}
        </button>
      </form>
    </div>
  );
}

function DynamicFormField({
  field,
  value,
  onValueChange,
}: {
  field: DisplayDynamicFormToolOutput["fields"][number];
  value: string | boolean | undefined;
  onValueChange: (value: string | boolean) => void;
}) {
  if (field.fieldType === "checkbox") {
    return (
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(event) => onValueChange(event.target.checked)}
          className="border-border rounded"
        />
        <span className="text-foreground text-sm">{field.fieldLabel}</span>
        {field.required && <span className="text-destructive text-xs">*</span>}
      </label>
    );
  }

  if (field.fieldType === "select") {
    return (
      <div>
        <label className="text-muted-foreground mb-1 block text-xs">
          {field.fieldLabel}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </label>
        <select
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onValueChange(event.target.value)}
          required={field.required}
          className="border-border bg-input text-foreground w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">{field.placeholder}</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.fieldType === "textarea") {
    return (
      <div>
        <label className="text-muted-foreground mb-1 block text-xs">
          {field.fieldLabel}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </label>
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          rows={3}
          className="border-border bg-input text-foreground w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
    );
  }

  return (
    <div>
      <label className="text-muted-foreground mb-1 block text-xs">
        {field.fieldLabel}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </label>
      <input
        type={field.fieldType}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={field.placeholder}
        required={field.required}
        className="border-border bg-input text-foreground w-full rounded-md border px-3 py-2 text-sm"
      />
    </div>
  );
}
