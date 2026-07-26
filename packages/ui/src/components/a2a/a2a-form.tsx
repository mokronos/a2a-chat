"use client"

import * as React from "react"
import type { A2AChat } from "@mokronos/a2a-react"
import { A2AInputRequest } from "./input-request"
import type { EventRenderer, PartRenderer } from "./renderers"
import type { DataPart, Part } from "../../lib/protocol"
import { cn } from "../../lib/utils"

export const FORM_EXTENSION_URI = "https://mokronos.dev/a2a/extensions/forms/v1" as const
export const FORM_EXTENSION_VERSION = 1 as const

export type FormFieldOption = { value: string; label?: string }
export type FormField = {
  name: string
  label?: string
  description?: string
  placeholder?: string
  type?: "text" | "email" | "url" | "password" | "number" | "date" | "textarea" | "boolean" | "select" | "radio"
  required?: boolean
  defaultValue?: string | number | boolean
  options?: readonly FormFieldOption[]
}
export type FormSpec = { version: 1; id: string; title?: string; description?: string; submitLabel?: string; fields: readonly FormField[] }
export type A2AFormValues = Record<string, string | number | boolean>
export type A2AFormProps = { spec: FormSpec; onSubmit: (values: A2AFormValues) => void | Promise<void>; disabled?: boolean; error?: string; className?: string }

export function createFormResponseParts(spec: FormSpec, values: A2AFormValues): Part[] {
  const readable = spec.fields.map((field) => `${field.label ?? field.name}: ${String(values[field.name] ?? "")}`).join("\n")
  const dataPart: DataPart = {
    kind: "data",
    data: { extension: FORM_EXTENSION_URI, version: FORM_EXTENSION_VERSION, formId: spec.id, values },
    metadata: { [FORM_EXTENSION_URI]: { version: FORM_EXTENSION_VERSION } },
  }
  return [{ kind: "text", text: readable }, dataPart]
}

export function isFormSpec(value: unknown): value is FormSpec {
  if (typeof value !== "object" || value === null) return false
  const candidate = value as Record<string, unknown>
  return candidate.version === 1 && typeof candidate.id === "string" && Array.isArray(candidate.fields)
}

export function createFormPartRenderer(controller?: A2AChat): PartRenderer {
  return (context) => {
    if (context.part.kind !== "data") return undefined
    const data = context.part.data
    if (data.extension !== FORM_EXTENSION_URI || data.version !== FORM_EXTENSION_VERSION || !isFormSpec(data.form)) return undefined
    if (context.turn.lifecycle.kind !== "awaiting-input") return undefined
    return <A2AInputRequest controller={controller} conversationId={context.conversation.id} turnId={context.turn.id} spec={data.form} />
  }
}

function formFromParts(parts: readonly Part[]): FormSpec | undefined {
  for (const part of parts) {
    if (
      part.kind === "data" &&
      part.data.extension === FORM_EXTENSION_URI &&
      part.data.version === FORM_EXTENSION_VERSION &&
      isFormSpec(part.data.form)
    ) return part.data.form
  }
  return undefined
}

export function createFormEventRenderer(controller?: A2AChat): EventRenderer {
  return (context) => {
    if (context.turn.lifecycle.kind !== "awaiting-input") return undefined
    const event = context.event
    let spec: FormSpec | undefined
    if (event.kind === "status-update") spec = event.status.message ? formFromParts(event.status.message.parts) : undefined
    else if (event.kind === "task") {
      spec = event.status.message ? formFromParts(event.status.message.parts) : undefined
      for (const message of [...(event.history ?? [])].reverse()) spec ??= formFromParts(message.parts)
    }
    return spec
      ? <A2AInputRequest controller={controller} conversationId={context.conversation.id} turnId={context.turn.id} spec={spec} />
      : undefined
  }
}

function initialValues(spec: FormSpec): A2AFormValues {
  return Object.fromEntries(spec.fields.map((field) => [field.name, field.defaultValue ?? (field.type === "boolean" ? false : "")]))
}

export function A2AForm({ spec, onSubmit, disabled, error, className }: A2AFormProps) {
  const [values, setValues] = React.useState<A2AFormValues>(() => initialValues(spec))
  const [submitting, setSubmitting] = React.useState(false)
  const formId = React.useId()
  return (
    <form className={cn("a2a-form", className)} aria-describedby={spec.description ? `${formId}-description` : undefined} onSubmit={async (event) => {
      event.preventDefault()
      if (disabled || submitting) return
      setSubmitting(true)
      try { await onSubmit(values) } finally { setSubmitting(false) }
    }}>
      <fieldset disabled={disabled || submitting}>
        {spec.title ? <legend>{spec.title}</legend> : null}
        {spec.description ? <p id={`${formId}-description`}>{spec.description}</p> : null}
        {spec.fields.map((field, index) => {
          const id = `${formId}-${index}`
          const descriptionId = field.description ? `${id}-description` : undefined
          const value = values[field.name] ?? ""
          const setValue = (next: string | number | boolean) => setValues((current) => ({ ...current, [field.name]: next }))
          if (field.type === "boolean") return <div className="a2a-form-field" key={field.name}><label htmlFor={id}><input id={id} name={field.name} type="checkbox" checked={Boolean(value)} required={field.required} aria-describedby={descriptionId} onChange={(event) => setValue(event.target.checked)} />{field.label ?? field.name}{field.required ? " *" : ""}</label>{field.description ? <small id={descriptionId}>{field.description}</small> : null}</div>
          const label = <label htmlFor={id}>{field.label ?? field.name}{field.required ? " *" : ""}</label>
          let control: React.ReactNode
          if (field.type === "textarea") control = <textarea id={id} name={field.name} value={String(value)} required={field.required} aria-describedby={descriptionId} placeholder={field.placeholder} onChange={(event) => setValue(event.target.value)} />
          else if (field.type === "select") control = <select id={id} name={field.name} value={String(value)} required={field.required} aria-describedby={descriptionId} onChange={(event) => setValue(event.target.value)}>{field.options?.map((option) => <option value={option.value} key={option.value}>{option.label ?? option.value}</option>)}</select>
          else if (field.type === "radio") control = <fieldset aria-describedby={descriptionId}><legend className="sr-only">{field.label ?? field.name}</legend>{field.options?.map((option, optionIndex) => <label key={option.value} htmlFor={`${id}-${optionIndex}`}><input id={`${id}-${optionIndex}`} type="radio" name={field.name} value={option.value} checked={String(value) === option.value} required={field.required} onChange={(event) => setValue(event.target.value)} />{option.label ?? option.value}</label>)}</fieldset>
          else control = <input id={id} name={field.name} type={field.type ?? "text"} value={String(value)} required={field.required} aria-describedby={descriptionId} placeholder={field.placeholder} onChange={(event) => setValue(field.type === "number" && event.target.value !== "" ? event.target.valueAsNumber : event.target.value)} />
          return <div className="a2a-form-field" key={field.name}>{label}{control}{field.description ? <small id={descriptionId}>{field.description}</small> : null}</div>
        })}
        {error ? <p role="alert">{error}</p> : null}
        <button type="submit">{submitting ? "Submitting" : spec.submitLabel ?? "Submit"}</button>
      </fieldset>
    </form>
  )
}
