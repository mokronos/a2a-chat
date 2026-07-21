import React from "react"

import type { FormField, FormSpec } from "@mokronos/a2a-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { cn } from "../../lib/utils"

export type A2AFormValues = Record<string, string | number | boolean>

export type A2AFormProps = {
  spec: FormSpec
  onSubmit: (values: A2AFormValues) => void
  /** Renders the form read-only (e.g. after the user has answered). */
  disabled?: boolean
  className?: string
}

function initialValues(spec: FormSpec): A2AFormValues {
  const values: A2AFormValues = {}
  for (const field of spec.fields) {
    if (field.defaultValue !== undefined) {
      values[field.name] = field.defaultValue
      continue
    }
    if (field.type === "boolean") {
      values[field.name] = false
      continue
    }
    if ((field.type === "select" || field.type === "radio") && field.options?.[0]) {
      values[field.name] = field.options[0].value
      continue
    }
    values[field.name] = ""
  }
  return values
}

const TEXT_INPUT_TYPES: Record<string, string> = {
  text: "text",
  email: "email",
  url: "url",
  password: "password",
  number: "number",
  date: "date",
}

function FieldControl({
  field,
  value,
  disabled,
  onChange,
}: {
  field: FormField
  value: string | number | boolean
  disabled?: boolean
  onChange: (value: string | number | boolean) => void
}) {
  const type = field.type ?? "text"

  if (type === "textarea") {
    return (
      <Textarea
        name={field.name}
        value={String(value ?? "")}
        placeholder={field.placeholder}
        required={field.required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    )
  }

  if (type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name={field.name}
          checked={Boolean(value)}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="size-4 rounded border-border accent-primary"
        />
        <span className="text-muted-foreground">{field.placeholder ?? "Yes"}</span>
      </label>
    )
  }

  if (type === "select") {
    return (
      <select
        name={field.name}
        value={String(value ?? "")}
        required={field.required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-8 w-full rounded-md border border-input bg-input/20 px-2 text-sm outline-none",
          "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50"
        )}
      >
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label ?? option.value}
          </option>
        ))}
      </select>
    )
  }

  if (type === "radio") {
    return (
      <div className="flex flex-col gap-1.5">
        {(field.options ?? []).map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={field.name}
              value={option.value}
              checked={String(value) === option.value}
              required={field.required}
              disabled={disabled}
              onChange={(event) => onChange(event.target.value)}
              className="size-4 border-border accent-primary"
            />
            <span>{option.label ?? option.value}</span>
          </label>
        ))}
      </div>
    )
  }

  return (
    <Input
      type={TEXT_INPUT_TYPES[type] ?? "text"}
      name={field.name}
      value={String(value ?? "")}
      placeholder={field.placeholder}
      required={field.required}
      disabled={disabled}
      onChange={(event) => {
        if (type !== "number") {
          onChange(event.target.value)
          return
        }
        const numeric = event.target.valueAsNumber
        onChange(Number.isNaN(numeric) ? event.target.value : numeric)
      }}
    />
  )
}

/** Renders a {@link FormSpec} as a controlled form and reports values on submit. */
export function A2AForm({ spec, onSubmit, disabled, className }: A2AFormProps) {
  const [values, setValues] = React.useState<A2AFormValues>(() => initialValues(spec))

  const setValue = React.useCallback((name: string, value: string | number | boolean) => {
    setValues((current) => ({ ...current, [name]: value }))
  }, [])

  return (
    <form
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-card/50 p-3",
        className
      )}
      onSubmit={(event) => {
        event.preventDefault()
        if (!disabled) {
          onSubmit(values)
        }
      }}
    >
      {spec.title ? <p className="text-sm font-medium text-foreground">{spec.title}</p> : null}
      {spec.description ? (
        <p className="text-xs text-muted-foreground">{spec.description}</p>
      ) : null}

      {spec.fields.map((field) => (
        <div key={field.name} className="flex flex-col gap-1">
          {field.type !== "boolean" ? (
            <label htmlFor={field.name} className="text-xs font-medium text-foreground">
              {field.label ?? field.name}
              {field.required ? <span className="text-destructive"> *</span> : null}
            </label>
          ) : null}
          <FieldControl
            field={field}
            value={values[field.name] ?? ""}
            disabled={disabled}
            onChange={(value) => setValue(field.name, value)}
          />
          {field.description ? (
            <p className="text-[11px] text-muted-foreground">{field.description}</p>
          ) : null}
        </div>
      ))}

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={disabled}>
          {spec.submitLabel ?? "Submit"}
        </Button>
      </div>
    </form>
  )
}
