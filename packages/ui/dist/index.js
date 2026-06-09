// src/A2AChat.tsx
import React15 from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PanelLeftCloseIcon, PanelLeftOpenIcon, PlusIcon as PlusIcon2, Trash2Icon } from "lucide-react";

// src/components/shared/input-box.tsx
import "react";

// src/components/ui/command.tsx
import "react";
import { Command as CommandPrimitive } from "cmdk";

// src/lib/utils.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// src/components/ui/dialog.tsx
import "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

// src/components/ui/button.tsx
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva } from "class-variance-authority";
import { jsx } from "react/jsx-runtime";
var buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-xs/relaxed font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline: "border-border hover:bg-input/50 hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-input/30",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost: "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-7 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        xs: "h-5 gap-1 rounded-sm px-2 text-[0.625rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-2.5",
        sm: "h-6 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        lg: "h-8 gap-1 px-2.5 text-xs/relaxed has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-4",
        icon: "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-xs": "size-5 rounded-sm [&_svg:not([class*='size-'])]:size-2.5",
        "icon-sm": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-lg": "size-8 [&_svg:not([class*='size-'])]:size-4"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    ButtonPrimitive,
    {
      "data-slot": "button",
      className: cn(buttonVariants({ variant, size, className })),
      ...props
    }
  );
}

// src/components/ui/dialog.tsx
import { XIcon } from "lucide-react";
import { jsx as jsx2, jsxs } from "react/jsx-runtime";

// src/components/ui/input-group.tsx
import "react";
import { cva as cva2 } from "class-variance-authority";

// src/components/ui/input.tsx
import "react";
import { jsx as jsx3 } from "react/jsx-runtime";
function Input({ className, ...props }) {
  return /* @__PURE__ */ jsx3(
    "input",
    {
      "data-slot": "input",
      className: cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props
    }
  );
}

// src/components/ui/textarea.tsx
import "react";
import { jsx as jsx4 } from "react/jsx-runtime";
function Textarea({ className, ...props }) {
  return /* @__PURE__ */ jsx4(
    "textarea",
    {
      "data-slot": "textarea",
      className: cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      ),
      ...props
    }
  );
}

// src/components/ui/input-group.tsx
import { jsx as jsx5 } from "react/jsx-runtime";
function InputGroup({ className, ...props }) {
  return /* @__PURE__ */ jsx5(
    "div",
    {
      "data-slot": "input-group",
      role: "group",
      className: cn(
        "group/input-group relative flex h-7 w-full min-w-0 items-center rounded-md border border-input bg-input/20 transition-colors outline-none in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0 has-data-[align=block-end]:rounded-md has-data-[align=block-start]:rounded-md has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/30 has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-2 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[textarea]:rounded-md has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto dark:bg-input/30 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pr-1.5 has-[>[data-align=inline-start]]:[&>input]:pl-1.5",
        className
      ),
      ...props
    }
  );
}
var inputGroupAddonVariants = cva2(
  "flex h-auto cursor-text items-center justify-center gap-1 py-2 text-xs/relaxed font-medium text-muted-foreground select-none group-data-[disabled=true]/input-group:opacity-50 **:data-[slot=kbd]:rounded-[calc(var(--radius-sm)-2px)] **:data-[slot=kbd]:bg-muted-foreground/10 **:data-[slot=kbd]:px-1 **:data-[slot=kbd]:text-[0.625rem] [&>svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      align: {
        "inline-start": "order-first pl-2 has-[>button]:ml-[-0.275rem] has-[>kbd]:ml-[-0.275rem]",
        "inline-end": "order-last pr-2 has-[>button]:mr-[-0.275rem] has-[>kbd]:mr-[-0.275rem]",
        "block-start": "order-first w-full justify-start px-2 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2",
        "block-end": "order-last w-full justify-start px-2 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2"
      }
    },
    defaultVariants: {
      align: "inline-start"
    }
  }
);
function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}) {
  return /* @__PURE__ */ jsx5(
    "div",
    {
      role: "group",
      "data-slot": "input-group-addon",
      "data-align": align,
      className: cn(inputGroupAddonVariants({ align }), className),
      onClick: (e) => {
        if (e.target.closest("button")) {
          return;
        }
        e.currentTarget.parentElement?.querySelector("input")?.focus();
      },
      ...props
    }
  );
}
var inputGroupButtonVariants = cva2(
  "flex items-center gap-2 rounded-md text-xs/relaxed shadow-none",
  {
    variants: {
      size: {
        xs: "h-5 gap-1 rounded-[calc(var(--radius-sm)-2px)] px-1 [&>svg:not([class*='size-'])]:size-3",
        sm: "gap-1",
        "icon-xs": "size-6 p-0 has-[>svg]:p-0",
        "icon-sm": "size-7 p-0 has-[>svg]:p-0"
      }
    },
    defaultVariants: {
      size: "xs"
    }
  }
);
function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}) {
  return /* @__PURE__ */ jsx5(
    Button,
    {
      type,
      "data-size": size,
      variant,
      className: cn(inputGroupButtonVariants({ size }), className),
      ...props
    }
  );
}
function InputGroupTextarea({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx5(
    Textarea,
    {
      "data-slot": "input-group-control",
      className: cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-2 shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent",
        className
      ),
      ...props
    }
  );
}

// src/components/ui/command.tsx
import { SearchIcon, CheckIcon } from "lucide-react";
import { jsx as jsx6, jsxs as jsxs2 } from "react/jsx-runtime";

// src/components/ui/dropdown-menu.tsx
import "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { ChevronRightIcon, CheckIcon as CheckIcon2 } from "lucide-react";
import { jsx as jsx7, jsxs as jsxs3 } from "react/jsx-runtime";

// src/components/ui/hover-card.tsx
import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card";
import { jsx as jsx8 } from "react/jsx-runtime";

// src/components/ui/select.tsx
import "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { ChevronDownIcon, CheckIcon as CheckIcon3, ChevronUpIcon } from "lucide-react";
import { jsx as jsx9, jsxs as jsxs4 } from "react/jsx-runtime";
var Select = SelectPrimitive.Root;

// src/components/ui/spinner.tsx
import "react";
import { jsx as jsx10 } from "react/jsx-runtime";
function Spinner({ className, ...props }) {
  return /* @__PURE__ */ jsx10(
    "span",
    {
      className: cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent",
        className
      ),
      ...props
    }
  );
}

// src/components/ui/tooltip.tsx
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { jsx as jsx11, jsxs as jsxs5 } from "react/jsx-runtime";

// src/components/ai-elements/prompt-input.tsx
import {
  CornerDownLeftIcon,
  ImageIcon,
  Monitor,
  PlusIcon,
  SquareIcon,
  XIcon as XIcon2
} from "lucide-react";
import { nanoid } from "nanoid";
import {
  Children,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Fragment, jsx as jsx12, jsxs as jsxs6 } from "react/jsx-runtime";
var convertBlobUrlToDataUrl = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};
var PromptInputController = createContext(
  null
);
var ProviderAttachmentsContext = createContext(
  null
);
var useOptionalPromptInputController = () => useContext(PromptInputController);
var useOptionalProviderAttachments = () => useContext(ProviderAttachmentsContext);
var LocalAttachmentsContext = createContext(null);
var usePromptInputAttachments = () => {
  const provider = useOptionalProviderAttachments();
  const local = useContext(LocalAttachmentsContext);
  const context = local ?? provider;
  if (!context) {
    throw new Error(
      "usePromptInputAttachments must be used within a PromptInput or PromptInputProvider"
    );
  }
  return context;
};
var LocalReferencedSourcesContext = createContext(null);
var PromptInput = ({
  className,
  accept,
  multiple,
  globalDrop,
  syncHiddenInput,
  maxFiles,
  maxFileSize,
  onError,
  onSubmit,
  children,
  ...props
}) => {
  const controller = useOptionalPromptInputController();
  const usingProvider = !!controller;
  const inputRef = useRef(null);
  const formRef = useRef(null);
  const [items, setItems] = useState([]);
  const files = usingProvider ? controller.attachments.files : items;
  const [referencedSources, setReferencedSources] = useState([]);
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);
  const openFileDialogLocal = useCallback(() => {
    inputRef.current?.click();
  }, []);
  const matchesAccept = useCallback(
    (f) => {
      if (!accept || accept.trim() === "") {
        return true;
      }
      const patterns = accept.split(",").map((s) => s.trim()).filter(Boolean);
      return patterns.some((pattern) => {
        if (pattern.endsWith("/*")) {
          const prefix = pattern.slice(0, -1);
          return f.type.startsWith(prefix);
        }
        return f.type === pattern;
      });
    },
    [accept]
  );
  const addLocal = useCallback(
    (fileList) => {
      const incoming = [...fileList];
      const accepted = incoming.filter((f) => matchesAccept(f));
      if (incoming.length && accepted.length === 0) {
        onError?.({
          code: "accept",
          message: "No files match the accepted types."
        });
        return;
      }
      const withinSize = (f) => maxFileSize ? f.size <= maxFileSize : true;
      const sized = accepted.filter(withinSize);
      if (accepted.length > 0 && sized.length === 0) {
        onError?.({
          code: "max_file_size",
          message: "All files exceed the maximum size."
        });
        return;
      }
      setItems((prev) => {
        const capacity = typeof maxFiles === "number" ? Math.max(0, maxFiles - prev.length) : void 0;
        const capped = typeof capacity === "number" ? sized.slice(0, capacity) : sized;
        if (typeof capacity === "number" && sized.length > capacity) {
          onError?.({
            code: "max_files",
            message: "Too many files. Some were not added."
          });
        }
        const next = [];
        for (const file of capped) {
          next.push({
            filename: file.name,
            id: nanoid(),
            mediaType: file.type,
            type: "file",
            url: URL.createObjectURL(file)
          });
        }
        return [...prev, ...next];
      });
    },
    [matchesAccept, maxFiles, maxFileSize, onError]
  );
  const removeLocal = useCallback(
    (id) => setItems((prev) => {
      const found = prev.find((file) => file.id === id);
      if (found?.url) {
        URL.revokeObjectURL(found.url);
      }
      return prev.filter((file) => file.id !== id);
    }),
    []
  );
  const addWithProviderValidation = useCallback(
    (fileList) => {
      const incoming = [...fileList];
      const accepted = incoming.filter((f) => matchesAccept(f));
      if (incoming.length && accepted.length === 0) {
        onError?.({
          code: "accept",
          message: "No files match the accepted types."
        });
        return;
      }
      const withinSize = (f) => maxFileSize ? f.size <= maxFileSize : true;
      const sized = accepted.filter(withinSize);
      if (accepted.length > 0 && sized.length === 0) {
        onError?.({
          code: "max_file_size",
          message: "All files exceed the maximum size."
        });
        return;
      }
      const currentCount = files.length;
      const capacity = typeof maxFiles === "number" ? Math.max(0, maxFiles - currentCount) : void 0;
      const capped = typeof capacity === "number" ? sized.slice(0, capacity) : sized;
      if (typeof capacity === "number" && sized.length > capacity) {
        onError?.({
          code: "max_files",
          message: "Too many files. Some were not added."
        });
      }
      if (capped.length > 0) {
        controller?.attachments.add(capped);
      }
    },
    [matchesAccept, maxFileSize, maxFiles, onError, files.length, controller]
  );
  const clearAttachments = useCallback(
    () => usingProvider ? controller?.attachments.clear() : setItems((prev) => {
      for (const file of prev) {
        if (file.url) {
          URL.revokeObjectURL(file.url);
        }
      }
      return [];
    }),
    [usingProvider, controller]
  );
  const clearReferencedSources = useCallback(
    () => setReferencedSources([]),
    []
  );
  const add = usingProvider ? addWithProviderValidation : addLocal;
  const remove = usingProvider ? controller.attachments.remove : removeLocal;
  const openFileDialog = usingProvider ? controller.attachments.openFileDialog : openFileDialogLocal;
  const clear = useCallback(() => {
    clearAttachments();
    clearReferencedSources();
  }, [clearAttachments, clearReferencedSources]);
  useEffect(() => {
    if (!usingProvider) {
      return;
    }
    controller.__registerFileInput(inputRef, () => inputRef.current?.click());
  }, [usingProvider, controller]);
  useEffect(() => {
    if (syncHiddenInput && inputRef.current && files.length === 0) {
      inputRef.current.value = "";
    }
  }, [files, syncHiddenInput]);
  useEffect(() => {
    const form = formRef.current;
    if (!form) {
      return;
    }
    if (globalDrop) {
      return;
    }
    const onDragOver = (e) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
      }
    };
    const onDrop = (e) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
      }
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        add(e.dataTransfer.files);
      }
    };
    form.addEventListener("dragover", onDragOver);
    form.addEventListener("drop", onDrop);
    return () => {
      form.removeEventListener("dragover", onDragOver);
      form.removeEventListener("drop", onDrop);
    };
  }, [add, globalDrop]);
  useEffect(() => {
    if (!globalDrop) {
      return;
    }
    const onDragOver = (e) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
      }
    };
    const onDrop = (e) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
      }
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        add(e.dataTransfer.files);
      }
    };
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("drop", onDrop);
    };
  }, [add, globalDrop]);
  useEffect(
    () => () => {
      if (!usingProvider) {
        for (const f of filesRef.current) {
          if (f.url) {
            URL.revokeObjectURL(f.url);
          }
        }
      }
    },
    [usingProvider]
  );
  const handleChange = useCallback(
    (event) => {
      if (event.currentTarget.files) {
        add(event.currentTarget.files);
      }
      event.currentTarget.value = "";
    },
    [add]
  );
  const attachmentsCtx = useMemo(
    () => ({
      add,
      clear: clearAttachments,
      fileInputRef: inputRef,
      files: files.map((item) => ({ ...item, id: item.id })),
      openFileDialog,
      remove
    }),
    [files, add, remove, clearAttachments, openFileDialog]
  );
  const refsCtx = useMemo(
    () => ({
      add: (incoming) => {
        const array = Array.isArray(incoming) ? incoming : [incoming];
        setReferencedSources((prev) => [
          ...prev,
          ...array.map((s) => ({ ...s, id: nanoid() }))
        ]);
      },
      clear: clearReferencedSources,
      remove: (id) => {
        setReferencedSources((prev) => prev.filter((s) => s.id !== id));
      },
      sources: referencedSources
    }),
    [referencedSources, clearReferencedSources]
  );
  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const text = usingProvider ? controller.textInput.value : (() => {
        const formData = new FormData(form);
        return formData.get("message") || "";
      })();
      if (!usingProvider) {
        form.reset();
      }
      try {
        const convertedFiles = await Promise.all(
          files.map(async ({ id: _id, ...item }) => {
            if (item.url?.startsWith("blob:")) {
              const dataUrl = await convertBlobUrlToDataUrl(item.url);
              return {
                ...item,
                url: dataUrl ?? item.url
              };
            }
            return item;
          })
        );
        const result = onSubmit({ files: convertedFiles, text }, event);
        if (result instanceof Promise) {
          try {
            await result;
            clear();
            if (usingProvider) {
              controller.textInput.clear();
            }
          } catch {
          }
        } else {
          clear();
          if (usingProvider) {
            controller.textInput.clear();
          }
        }
      } catch {
      }
    },
    [usingProvider, controller, files, onSubmit, clear]
  );
  const inner = /* @__PURE__ */ jsxs6(Fragment, { children: [
    /* @__PURE__ */ jsx12(
      "input",
      {
        accept,
        "aria-label": "Upload files",
        className: "hidden",
        multiple,
        onChange: handleChange,
        ref: inputRef,
        title: "Upload files",
        type: "file"
      }
    ),
    /* @__PURE__ */ jsx12(
      "form",
      {
        className: cn("w-full", className),
        onSubmit: handleSubmit,
        ref: formRef,
        ...props,
        children: /* @__PURE__ */ jsx12(InputGroup, { className: "overflow-hidden", children })
      }
    )
  ] });
  const withReferencedSources = /* @__PURE__ */ jsx12(LocalReferencedSourcesContext.Provider, { value: refsCtx, children: inner });
  return /* @__PURE__ */ jsx12(LocalAttachmentsContext.Provider, { value: attachmentsCtx, children: withReferencedSources });
};
var PromptInputBody = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx12("div", { className: cn("contents", className), ...props });
var PromptInputTextarea = ({
  onChange,
  onKeyDown,
  className,
  placeholder = "What would you like to know?",
  ...props
}) => {
  const controller = useOptionalPromptInputController();
  const attachments = usePromptInputAttachments();
  const [isComposing, setIsComposing] = useState(false);
  const handleKeyDown = useCallback(
    (e) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) {
        return;
      }
      if (e.key === "Enter") {
        if (isComposing || e.nativeEvent.isComposing) {
          return;
        }
        if (e.shiftKey) {
          return;
        }
        e.preventDefault();
        const { form } = e.currentTarget;
        const submitButton = form?.querySelector(
          'button[type="submit"]'
        );
        if (submitButton?.disabled) {
          return;
        }
        form?.requestSubmit();
      }
      if (e.key === "Backspace" && e.currentTarget.value === "" && attachments.files.length > 0) {
        e.preventDefault();
        const lastAttachment = attachments.files.at(-1);
        if (lastAttachment) {
          attachments.remove(lastAttachment.id);
        }
      }
    },
    [onKeyDown, isComposing, attachments]
  );
  const handlePaste = useCallback(
    (event) => {
      const items = event.clipboardData?.items;
      if (!items) {
        return;
      }
      const files = [];
      for (const item of items) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }
      if (files.length > 0) {
        event.preventDefault();
        attachments.add(files);
      }
    },
    [attachments]
  );
  const handleCompositionEnd = useCallback(() => setIsComposing(false), []);
  const handleCompositionStart = useCallback(() => setIsComposing(true), []);
  const controlledProps = controller ? {
    onChange: (e) => {
      controller.textInput.setInput(e.currentTarget.value);
      onChange?.(e);
    },
    value: controller.textInput.value
  } : {
    onChange
  };
  return /* @__PURE__ */ jsx12(
    InputGroupTextarea,
    {
      className: cn("field-sizing-content max-h-48 min-h-16", className),
      name: "message",
      onCompositionEnd: handleCompositionEnd,
      onCompositionStart: handleCompositionStart,
      onKeyDown: handleKeyDown,
      onPaste: handlePaste,
      placeholder,
      ...props,
      ...controlledProps
    }
  );
};
var PromptInputFooter = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx12(
  InputGroupAddon,
  {
    align: "block-end",
    className: cn("justify-between gap-1", className),
    ...props
  }
);
var PromptInputTools = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx12(
  "div",
  {
    className: cn("flex min-w-0 items-center gap-1", className),
    ...props
  }
);
var PromptInputSubmit = ({
  className,
  variant = "default",
  size = "icon-sm",
  status,
  onStop,
  onClick,
  children,
  ...props
}) => {
  const isGenerating = status === "submitted" || status === "streaming";
  let Icon = /* @__PURE__ */ jsx12(CornerDownLeftIcon, { className: "size-4" });
  if (status === "submitted") {
    Icon = /* @__PURE__ */ jsx12(Spinner, {});
  } else if (status === "streaming") {
    Icon = /* @__PURE__ */ jsx12(SquareIcon, { className: "size-4" });
  } else if (status === "error") {
    Icon = /* @__PURE__ */ jsx12(XIcon2, { className: "size-4" });
  }
  const handleClick = useCallback(
    (e) => {
      if (isGenerating && onStop) {
        e.preventDefault();
        onStop();
        return;
      }
      onClick?.(e);
    },
    [isGenerating, onStop, onClick]
  );
  return /* @__PURE__ */ jsx12(
    InputGroupButton,
    {
      "aria-label": isGenerating ? "Stop" : "Submit",
      className: cn(className),
      onClick: handleClick,
      size,
      type: isGenerating && onStop ? "button" : "submit",
      variant,
      ...props,
      children: children ?? Icon
    }
  );
};

// src/components/shared/input-box.tsx
import { jsx as jsx13, jsxs as jsxs7 } from "react/jsx-runtime";
function InputBox({ value, onChange, onSubmit, disabled = false }) {
  const canSubmit = !disabled && value.trim().length > 0;
  return /* @__PURE__ */ jsxs7(
    PromptInput,
    {
      onSubmit: () => {
        if (canSubmit) {
          onSubmit();
        }
      },
      children: [
        /* @__PURE__ */ jsx13(PromptInputBody, { children: /* @__PURE__ */ jsx13(
          PromptInputTextarea,
          {
            placeholder: "Write a message...",
            value,
            onChange: (event) => onChange(event.currentTarget.value),
            disabled
          }
        ) }),
        /* @__PURE__ */ jsxs7(PromptInputFooter, { children: [
          /* @__PURE__ */ jsx13(PromptInputTools, {}),
          /* @__PURE__ */ jsx13(PromptInputSubmit, { disabled: !canSubmit, "aria-label": "Send message" })
        ] })
      ]
    }
  );
}

// src/components/shared/message-box.tsx
import "react";
import { MessageSquareIcon } from "lucide-react";

// src/components/ai-elements/conversation.tsx
import { ArrowDownIcon, DownloadIcon } from "lucide-react";
import { useCallback as useCallback2 } from "react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { Fragment as Fragment2, jsx as jsx14, jsxs as jsxs8 } from "react/jsx-runtime";
var Conversation = ({ className, ...props }) => /* @__PURE__ */ jsx14(
  StickToBottom,
  {
    className: cn("relative flex-1 overflow-y-hidden", className),
    initial: "smooth",
    resize: "smooth",
    role: "log",
    ...props
  }
);
var ConversationContent = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx14(
  StickToBottom.Content,
  {
    className: cn("flex flex-col gap-8 p-4", className),
    ...props
  }
);
var ConversationEmptyState = ({
  className,
  title = "No messages yet",
  description = "Start a conversation to see messages here",
  icon,
  children,
  ...props
}) => /* @__PURE__ */ jsx14(
  "div",
  {
    className: cn(
      "flex size-full flex-col items-center justify-center gap-3 p-8 text-center",
      className
    ),
    ...props,
    children: children ?? /* @__PURE__ */ jsxs8(Fragment2, { children: [
      icon && /* @__PURE__ */ jsx14("div", { className: "text-muted-foreground", children: icon }),
      /* @__PURE__ */ jsxs8("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx14("h3", { className: "font-medium text-sm", children: title }),
        description && /* @__PURE__ */ jsx14("p", { className: "text-muted-foreground text-sm", children: description })
      ] })
    ] })
  }
);
var ConversationScrollButton = ({
  className,
  ...props
}) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();
  const handleScrollToBottom = useCallback2(() => {
    scrollToBottom();
  }, [scrollToBottom]);
  return !isAtBottom && /* @__PURE__ */ jsx14(
    Button,
    {
      className: cn(
        "absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full dark:bg-background dark:hover:bg-muted",
        className
      ),
      onClick: handleScrollToBottom,
      size: "icon",
      type: "button",
      variant: "outline",
      ...props,
      children: /* @__PURE__ */ jsx14(ArrowDownIcon, { className: "size-4" })
    }
  );
};

// src/components/ui/button-group.tsx
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva as cva3 } from "class-variance-authority";

// src/components/ui/separator.tsx
import "react";
import { jsx as jsx15 } from "react/jsx-runtime";

// src/components/ui/button-group.tsx
import { jsx as jsx16 } from "react/jsx-runtime";
var buttonGroupVariants = cva3(
  "flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10 has-[>[data-slot=button-group]]:gap-2 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-md [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
  {
    variants: {
      orientation: {
        horizontal: "*:data-slot:rounded-r-none [&>[data-slot]:not(:has(~[data-slot]))]:rounded-r-md! [&>[data-slot]~[data-slot]]:rounded-l-none [&>[data-slot]~[data-slot]]:border-l-0",
        vertical: "flex-col *:data-slot:rounded-b-none [&>[data-slot]:not(:has(~[data-slot]))]:rounded-b-md! [&>[data-slot]~[data-slot]]:rounded-t-none [&>[data-slot]~[data-slot]]:border-t-0"
      }
    },
    defaultVariants: {
      orientation: "horizontal"
    }
  }
);

// src/components/ai-elements/message.tsx
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { ChevronLeftIcon, ChevronRightIcon as ChevronRightIcon2 } from "lucide-react";
import {
  createContext as createContext2,
  memo,
  useCallback as useCallback3,
  useContext as useContext2,
  useEffect as useEffect2,
  useMemo as useMemo2,
  useState as useState2
} from "react";
import { Streamdown } from "streamdown";
import { jsx as jsx17, jsxs as jsxs9 } from "react/jsx-runtime";
var Message = ({ className, from, ...props }) => /* @__PURE__ */ jsx17(
  "div",
  {
    className: cn(
      "group flex w-full max-w-[95%] flex-col gap-2",
      from === "user" ? "is-user ml-auto justify-end" : "is-assistant",
      className
    ),
    ...props
  }
);
var MessageContent = ({
  children,
  className,
  ...props
}) => /* @__PURE__ */ jsx17(
  "div",
  {
    className: cn(
      "is-user:dark flex w-fit min-w-0 max-w-full flex-col gap-2 overflow-hidden text-sm",
      "group-[.is-user]:ml-auto group-[.is-user]:rounded-lg group-[.is-user]:bg-secondary group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-foreground",
      "group-[.is-assistant]:text-foreground",
      className
    ),
    ...props,
    children
  }
);
var MessageBranchContext = createContext2(
  null
);
var streamdownPlugins = { cjk, code, math, mermaid };
var MessageResponse = memo(
  ({ className, ...props }) => /* @__PURE__ */ jsx17(
    Streamdown,
    {
      className: cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      ),
      plugins: streamdownPlugins,
      ...props
    }
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children && nextProps.isAnimating === prevProps.isAnimating
);
MessageResponse.displayName = "MessageResponse";

// src/components/ai-elements/reasoning.tsx
import { useControllableState } from "@radix-ui/react-use-controllable-state";

// src/components/ui/collapsible.tsx
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import { jsx as jsx18 } from "react/jsx-runtime";
function Collapsible({ ...props }) {
  return /* @__PURE__ */ jsx18(CollapsiblePrimitive.Root, { "data-slot": "collapsible", ...props });
}
function CollapsibleTrigger({ ...props }) {
  return /* @__PURE__ */ jsx18(CollapsiblePrimitive.Trigger, { "data-slot": "collapsible-trigger", ...props });
}
function CollapsibleContent({ ...props }) {
  return /* @__PURE__ */ jsx18(CollapsiblePrimitive.Panel, { "data-slot": "collapsible-content", ...props });
}

// src/components/ai-elements/reasoning.tsx
import { cjk as cjk2 } from "@streamdown/cjk";
import { code as code2 } from "@streamdown/code";
import { math as math2 } from "@streamdown/math";
import { mermaid as mermaid2 } from "@streamdown/mermaid";
import { BrainIcon, ChevronDownIcon as ChevronDownIcon2 } from "lucide-react";
import {
  createContext as createContext3,
  memo as memo3,
  useCallback as useCallback4,
  useContext as useContext3,
  useEffect as useEffect3,
  useMemo as useMemo4,
  useRef as useRef2,
  useState as useState3
} from "react";
import { Streamdown as Streamdown2 } from "streamdown";

// src/components/ai-elements/shimmer.tsx
import { motion } from "motion/react";
import { memo as memo2, useMemo as useMemo3 } from "react";
import { jsx as jsx19 } from "react/jsx-runtime";
var motionComponentCache = /* @__PURE__ */ new Map();
var getMotionComponent = (element) => {
  let component = motionComponentCache.get(element);
  if (!component) {
    component = motion.create(element);
    motionComponentCache.set(element, component);
  }
  return component;
};
var ShimmerComponent = ({
  children,
  as: Component = "p",
  className,
  duration = 2,
  spread = 2
}) => {
  const MotionComponent = getMotionComponent(
    Component
  );
  const dynamicSpread = useMemo3(
    () => (children?.length ?? 0) * spread,
    [children, spread]
  );
  return /* @__PURE__ */ jsx19(
    MotionComponent,
    {
      animate: { backgroundPosition: "0% center" },
      className: cn(
        "relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent",
        "[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--color-background),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]",
        className
      ),
      initial: { backgroundPosition: "100% center" },
      style: {
        "--spread": `${dynamicSpread}px`,
        backgroundImage: "var(--bg), linear-gradient(var(--color-muted-foreground), var(--color-muted-foreground))"
      },
      transition: {
        duration,
        ease: "linear",
        repeat: Number.POSITIVE_INFINITY
      },
      children
    }
  );
};
var Shimmer = memo2(ShimmerComponent);

// src/components/ai-elements/reasoning.tsx
import { Fragment as Fragment3, jsx as jsx20, jsxs as jsxs10 } from "react/jsx-runtime";
var ReasoningContext = createContext3(null);
var useReasoning = () => {
  const context = useContext3(ReasoningContext);
  if (!context) {
    throw new Error("Reasoning components must be used within Reasoning");
  }
  return context;
};
var AUTO_CLOSE_DELAY = 1e3;
var MS_IN_S = 1e3;
var Reasoning = memo3(
  ({
    className,
    isStreaming = false,
    open,
    defaultOpen,
    onOpenChange,
    duration: durationProp,
    children,
    ...props
  }) => {
    const resolvedDefaultOpen = defaultOpen ?? isStreaming;
    const isExplicitlyClosed = defaultOpen === false;
    const [isOpen, setIsOpen] = useControllableState({
      defaultProp: resolvedDefaultOpen,
      onChange: onOpenChange,
      prop: open
    });
    const [duration, setDuration] = useControllableState({
      defaultProp: void 0,
      prop: durationProp
    });
    const hasEverStreamedRef = useRef2(isStreaming);
    const [hasAutoClosed, setHasAutoClosed] = useState3(false);
    const startTimeRef = useRef2(null);
    useEffect3(() => {
      if (isStreaming) {
        hasEverStreamedRef.current = true;
        if (startTimeRef.current === null) {
          startTimeRef.current = Date.now();
        }
      } else if (startTimeRef.current !== null) {
        setDuration(Math.ceil((Date.now() - startTimeRef.current) / MS_IN_S));
        startTimeRef.current = null;
      }
    }, [isStreaming, setDuration]);
    useEffect3(() => {
      if (isStreaming && !isOpen && !isExplicitlyClosed) {
        setIsOpen(true);
      }
    }, [isStreaming, isOpen, setIsOpen, isExplicitlyClosed]);
    useEffect3(() => {
      if (hasEverStreamedRef.current && !isStreaming && isOpen && !hasAutoClosed) {
        const timer = setTimeout(() => {
          setIsOpen(false);
          setHasAutoClosed(true);
        }, AUTO_CLOSE_DELAY);
        return () => clearTimeout(timer);
      }
    }, [isStreaming, isOpen, setIsOpen, hasAutoClosed]);
    const handleOpenChange = useCallback4(
      (newOpen) => {
        setIsOpen(newOpen);
      },
      [setIsOpen]
    );
    const contextValue = useMemo4(
      () => ({ duration, isOpen, isStreaming, setIsOpen }),
      [duration, isOpen, isStreaming, setIsOpen]
    );
    return /* @__PURE__ */ jsx20(ReasoningContext.Provider, { value: contextValue, children: /* @__PURE__ */ jsx20(
      Collapsible,
      {
        className: cn("not-prose mb-4", className),
        onOpenChange: handleOpenChange,
        open: isOpen,
        ...props,
        children
      }
    ) });
  }
);
var defaultGetThinkingMessage = (isStreaming, duration) => {
  if (isStreaming || duration === 0) {
    return /* @__PURE__ */ jsx20(Shimmer, { duration: 1, children: "Thinking..." });
  }
  if (duration === void 0) {
    return /* @__PURE__ */ jsx20("p", { children: "Thought for a few seconds" });
  }
  return /* @__PURE__ */ jsxs10("p", { children: [
    "Thought for ",
    duration,
    " seconds"
  ] });
};
var ReasoningTrigger = memo3(
  ({
    className,
    children,
    getThinkingMessage = defaultGetThinkingMessage,
    ...props
  }) => {
    const { isStreaming, isOpen, duration } = useReasoning();
    return /* @__PURE__ */ jsx20(
      CollapsibleTrigger,
      {
        className: cn(
          "flex w-full items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground",
          className
        ),
        ...props,
        children: children ?? /* @__PURE__ */ jsxs10(Fragment3, { children: [
          /* @__PURE__ */ jsx20(BrainIcon, { className: "size-4" }),
          getThinkingMessage(isStreaming, duration),
          /* @__PURE__ */ jsx20(
            ChevronDownIcon2,
            {
              className: cn(
                "size-4 transition-transform",
                isOpen ? "rotate-180" : "rotate-0"
              )
            }
          )
        ] })
      }
    );
  }
);
var streamdownPlugins2 = { cjk: cjk2, code: code2, math: math2, mermaid: mermaid2 };
var ReasoningContent = memo3(
  ({ className, children, ...props }) => /* @__PURE__ */ jsx20(
    CollapsibleContent,
    {
      className: cn(
        "mt-4 text-sm",
        "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-muted-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx20(Streamdown2, { plugins: streamdownPlugins2, children })
    }
  )
);
Reasoning.displayName = "Reasoning";
ReasoningTrigger.displayName = "ReasoningTrigger";
ReasoningContent.displayName = "ReasoningContent";

// src/components/ai-elements/task.tsx
import { ChevronDownIcon as ChevronDownIcon3, SearchIcon as SearchIcon2 } from "lucide-react";
import { jsx as jsx21, jsxs as jsxs11 } from "react/jsx-runtime";
var TaskItem = ({ children, className, ...props }) => /* @__PURE__ */ jsx21("div", { className: cn("text-muted-foreground text-sm", className), ...props, children });
var Task = ({
  defaultOpen = true,
  className,
  ...props
}) => /* @__PURE__ */ jsx21(Collapsible, { className: cn(className), defaultOpen, ...props });
var TaskTrigger = ({
  children,
  className,
  title,
  ...props
}) => /* @__PURE__ */ jsx21(CollapsibleTrigger, { className: cn("group", className), ...props, children: children ?? /* @__PURE__ */ jsxs11("div", { className: "flex w-full cursor-pointer items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground", children: [
  /* @__PURE__ */ jsx21(SearchIcon2, { className: "size-4" }),
  /* @__PURE__ */ jsx21("p", { className: "text-sm", children: title }),
  /* @__PURE__ */ jsx21(ChevronDownIcon3, { className: "size-4 transition-transform group-data-[state=open]:rotate-180" })
] }) });
var TaskContent = ({
  children,
  className,
  ...props
}) => /* @__PURE__ */ jsx21(
  CollapsibleContent,
  {
    className: cn(
      "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx21("div", { className: "mt-4 space-y-2 border-muted border-l-2 pl-4", children })
  }
);

// src/components/ai-elements/chain-of-thought.tsx
import { useControllableState as useControllableState2 } from "@radix-ui/react-use-controllable-state";

// src/components/ui/badge.tsx
import { mergeProps as mergeProps2 } from "@base-ui/react/merge-props";
import { useRender as useRender2 } from "@base-ui/react/use-render";
import { cva as cva4 } from "class-variance-authority";
var badgeVariants = cva4(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-[0.625rem] font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-2.5!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive: "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline: "border-border bg-input/20 text-foreground dark:bg-input/30 [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({
  className,
  variant = "default",
  render,
  ...props
}) {
  return useRender2({
    defaultTagName: "span",
    props: mergeProps2(
      {
        className: cn(badgeVariants({ variant }), className)
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant
    }
  });
}

// src/components/ai-elements/chain-of-thought.tsx
import { BrainIcon as BrainIcon2, ChevronDownIcon as ChevronDownIcon4, DotIcon } from "lucide-react";
import { createContext as createContext4, memo as memo4, useContext as useContext4, useMemo as useMemo5 } from "react";
import { jsx as jsx22, jsxs as jsxs12 } from "react/jsx-runtime";
var ChainOfThoughtContext = createContext4(
  null
);
var useChainOfThought = () => {
  const context = useContext4(ChainOfThoughtContext);
  if (!context) {
    throw new Error(
      "ChainOfThought components must be used within ChainOfThought"
    );
  }
  return context;
};
var ChainOfThought = memo4(
  ({
    className,
    open,
    defaultOpen = false,
    onOpenChange,
    children,
    ...props
  }) => {
    const [isOpen, setIsOpen] = useControllableState2({
      defaultProp: defaultOpen,
      onChange: onOpenChange,
      prop: open
    });
    const chainOfThoughtContext = useMemo5(
      () => ({ isOpen, setIsOpen }),
      [isOpen, setIsOpen]
    );
    return /* @__PURE__ */ jsx22(ChainOfThoughtContext.Provider, { value: chainOfThoughtContext, children: /* @__PURE__ */ jsx22("div", { className: cn("not-prose w-full space-y-4", className), ...props, children }) });
  }
);
var ChainOfThoughtHeader = memo4(
  ({ className, children, ...props }) => {
    const { isOpen, setIsOpen } = useChainOfThought();
    return /* @__PURE__ */ jsx22(Collapsible, { onOpenChange: setIsOpen, open: isOpen, children: /* @__PURE__ */ jsxs12(
      CollapsibleTrigger,
      {
        className: cn(
          "flex w-full items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground",
          className
        ),
        ...props,
        children: [
          /* @__PURE__ */ jsx22(BrainIcon2, { className: "size-4" }),
          /* @__PURE__ */ jsx22("span", { className: "flex-1 text-left", children: children ?? "Chain of Thought" }),
          /* @__PURE__ */ jsx22(
            ChevronDownIcon4,
            {
              className: cn(
                "size-4 transition-transform",
                isOpen ? "rotate-180" : "rotate-0"
              )
            }
          )
        ]
      }
    ) });
  }
);
var stepStatusStyles = {
  active: "text-foreground",
  complete: "text-muted-foreground",
  pending: "text-muted-foreground/50"
};
var ChainOfThoughtStep = memo4(
  ({
    className,
    icon: Icon = DotIcon,
    label,
    description,
    status = "complete",
    children,
    ...props
  }) => /* @__PURE__ */ jsxs12(
    "div",
    {
      className: cn(
        "flex gap-2 text-sm",
        stepStatusStyles[status],
        "fade-in-0 slide-in-from-top-2 animate-in",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsxs12("div", { className: "relative mt-0.5", children: [
          /* @__PURE__ */ jsx22(Icon, { className: "size-4" }),
          /* @__PURE__ */ jsx22("div", { className: "absolute top-7 bottom-0 left-1/2 -mx-px w-px bg-border" })
        ] }),
        /* @__PURE__ */ jsxs12("div", { className: "flex-1 space-y-2 overflow-hidden", children: [
          /* @__PURE__ */ jsx22("div", { children: label }),
          description && /* @__PURE__ */ jsx22("div", { className: "text-muted-foreground text-xs", children: description }),
          children
        ] })
      ]
    }
  )
);
var ChainOfThoughtSearchResults = memo4(
  ({ className, ...props }) => /* @__PURE__ */ jsx22(
    "div",
    {
      className: cn("flex flex-wrap items-center gap-2", className),
      ...props
    }
  )
);
var ChainOfThoughtSearchResult = memo4(
  ({ className, children, ...props }) => /* @__PURE__ */ jsx22(
    Badge,
    {
      className: cn("gap-1 px-2 py-0.5 font-normal text-xs", className),
      variant: "secondary",
      ...props,
      children
    }
  )
);
var ChainOfThoughtContent = memo4(
  ({ className, children, ...props }) => {
    const { isOpen } = useChainOfThought();
    return /* @__PURE__ */ jsx22(Collapsible, { open: isOpen, children: /* @__PURE__ */ jsx22(
      CollapsibleContent,
      {
        className: cn(
          "mt-2 space-y-3",
          "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
          className
        ),
        ...props,
        children
      }
    ) });
  }
);
var ChainOfThoughtImage = memo4(
  ({ className, children, caption, ...props }) => /* @__PURE__ */ jsxs12("div", { className: cn("mt-2 space-y-2", className), ...props, children: [
    /* @__PURE__ */ jsx22("div", { className: "relative flex max-h-[22rem] items-center justify-center overflow-hidden rounded-lg bg-muted p-3", children }),
    caption && /* @__PURE__ */ jsx22("p", { className: "text-muted-foreground text-xs", children: caption })
  ] })
);
ChainOfThought.displayName = "ChainOfThought";
ChainOfThoughtHeader.displayName = "ChainOfThoughtHeader";
ChainOfThoughtStep.displayName = "ChainOfThoughtStep";
ChainOfThoughtSearchResults.displayName = "ChainOfThoughtSearchResults";
ChainOfThoughtSearchResult.displayName = "ChainOfThoughtSearchResult";
ChainOfThoughtContent.displayName = "ChainOfThoughtContent";
ChainOfThoughtImage.displayName = "ChainOfThoughtImage";

// src/components/ai-elements/code-block.tsx
import { CheckIcon as CheckIcon4, CopyIcon } from "lucide-react";
import {
  createContext as createContext5,
  memo as memo5,
  useCallback as useCallback5,
  useContext as useContext5,
  useEffect as useEffect4,
  useMemo as useMemo6,
  useRef as useRef3,
  useState as useState4
} from "react";
import { createHighlighter } from "shiki";
import { jsx as jsx23, jsxs as jsxs13 } from "react/jsx-runtime";
var isItalic = (fontStyle) => fontStyle && fontStyle & 1;
var isBold = (fontStyle) => fontStyle && fontStyle & 2;
var isUnderline = (fontStyle) => (
  // oxlint-disable-next-line eslint(no-bitwise)
  fontStyle && fontStyle & 4
);
var addKeysToTokens = (lines) => lines.map((line, lineIdx) => ({
  key: `line-${lineIdx}`,
  tokens: line.map((token, tokenIdx) => ({
    key: `line-${lineIdx}-${tokenIdx}`,
    token
  }))
}));
var TokenSpan = ({ token }) => /* @__PURE__ */ jsx23(
  "span",
  {
    className: "dark:!bg-[var(--shiki-dark-bg)] dark:!text-[var(--shiki-dark)]",
    style: {
      backgroundColor: token.bgColor,
      color: token.color,
      fontStyle: isItalic(token.fontStyle) ? "italic" : void 0,
      fontWeight: isBold(token.fontStyle) ? "bold" : void 0,
      textDecoration: isUnderline(token.fontStyle) ? "underline" : void 0,
      ...token.htmlStyle
    },
    children: token.content
  }
);
var LINE_NUMBER_CLASSES = cn(
  "block",
  "before:content-[counter(line)]",
  "before:inline-block",
  "before:[counter-increment:line]",
  "before:w-8",
  "before:mr-4",
  "before:text-right",
  "before:text-muted-foreground/50",
  "before:font-mono",
  "before:select-none"
);
var LineSpan = ({
  keyedLine,
  showLineNumbers
}) => /* @__PURE__ */ jsx23("span", { className: showLineNumbers ? LINE_NUMBER_CLASSES : "block", children: keyedLine.tokens.length === 0 ? "\n" : keyedLine.tokens.map(({ token, key }) => /* @__PURE__ */ jsx23(TokenSpan, { token }, key)) });
var CodeBlockContext = createContext5({
  code: ""
});
var highlighterCache = /* @__PURE__ */ new Map();
var tokensCache = /* @__PURE__ */ new Map();
var subscribers = /* @__PURE__ */ new Map();
var getTokensCacheKey = (code3, language) => {
  const start = code3.slice(0, 100);
  const end = code3.length > 100 ? code3.slice(-100) : "";
  return `${language}:${code3.length}:${start}:${end}`;
};
var getHighlighter = (language) => {
  const cached = highlighterCache.get(language);
  if (cached) {
    return cached;
  }
  const highlighterPromise = createHighlighter({
    langs: [language],
    themes: ["github-light", "github-dark"]
  });
  highlighterCache.set(language, highlighterPromise);
  return highlighterPromise;
};
var createRawTokens = (code3) => ({
  bg: "transparent",
  fg: "inherit",
  tokens: code3.split("\n").map(
    (line) => line === "" ? [] : [
      {
        color: "inherit",
        content: line
      }
    ]
  )
});
var highlightCode = (code3, language, callback) => {
  const tokensCacheKey = getTokensCacheKey(code3, language);
  const cached = tokensCache.get(tokensCacheKey);
  if (cached) {
    return cached;
  }
  if (callback) {
    if (!subscribers.has(tokensCacheKey)) {
      subscribers.set(tokensCacheKey, /* @__PURE__ */ new Set());
    }
    subscribers.get(tokensCacheKey)?.add(callback);
  }
  getHighlighter(language).then((highlighter) => {
    const availableLangs = highlighter.getLoadedLanguages();
    const langToUse = availableLangs.includes(language) ? language : "text";
    const result = highlighter.codeToTokens(code3, {
      lang: langToUse,
      themes: {
        dark: "github-dark",
        light: "github-light"
      }
    });
    const tokenized = {
      bg: result.bg ?? "transparent",
      fg: result.fg ?? "inherit",
      tokens: result.tokens
    };
    tokensCache.set(tokensCacheKey, tokenized);
    const subs = subscribers.get(tokensCacheKey);
    if (subs) {
      for (const sub of subs) {
        sub(tokenized);
      }
      subscribers.delete(tokensCacheKey);
    }
  }).catch((error) => {
    console.error("Failed to highlight code:", error);
    subscribers.delete(tokensCacheKey);
  });
  return null;
};
var CodeBlockBody = memo5(
  ({
    tokenized,
    showLineNumbers,
    className
  }) => {
    const preStyle = useMemo6(
      () => ({
        backgroundColor: tokenized.bg,
        color: tokenized.fg
      }),
      [tokenized.bg, tokenized.fg]
    );
    const keyedLines = useMemo6(
      () => addKeysToTokens(tokenized.tokens),
      [tokenized.tokens]
    );
    return /* @__PURE__ */ jsx23(
      "pre",
      {
        className: cn(
          "dark:!bg-[var(--shiki-dark-bg)] dark:!text-[var(--shiki-dark)] m-0 p-4 text-sm",
          className
        ),
        style: preStyle,
        children: /* @__PURE__ */ jsx23(
          "code",
          {
            className: cn(
              "font-mono text-sm",
              showLineNumbers && "[counter-increment:line_0] [counter-reset:line]"
            ),
            children: keyedLines.map((keyedLine) => /* @__PURE__ */ jsx23(
              LineSpan,
              {
                keyedLine,
                showLineNumbers
              },
              keyedLine.key
            ))
          }
        )
      }
    );
  },
  (prevProps, nextProps) => prevProps.tokenized === nextProps.tokenized && prevProps.showLineNumbers === nextProps.showLineNumbers && prevProps.className === nextProps.className
);
CodeBlockBody.displayName = "CodeBlockBody";
var CodeBlockContainer = ({
  className,
  language,
  style,
  ...props
}) => /* @__PURE__ */ jsx23(
  "div",
  {
    className: cn(
      "group relative w-full overflow-hidden rounded-md border bg-background text-foreground",
      className
    ),
    "data-language": language,
    style: {
      containIntrinsicSize: "auto 200px",
      contentVisibility: "auto",
      ...style
    },
    ...props
  }
);
var CodeBlockContent = ({
  code: code3,
  language,
  showLineNumbers = false
}) => {
  const rawTokens = useMemo6(() => createRawTokens(code3), [code3]);
  const syncTokens = useMemo6(
    () => highlightCode(code3, language) ?? rawTokens,
    [code3, language, rawTokens]
  );
  const [asyncTokens, setAsyncTokens] = useState4(null);
  const asyncKeyRef = useRef3({ code: code3, language });
  if (asyncKeyRef.current.code !== code3 || asyncKeyRef.current.language !== language) {
    asyncKeyRef.current = { code: code3, language };
    setAsyncTokens(null);
  }
  useEffect4(() => {
    let cancelled = false;
    highlightCode(code3, language, (result) => {
      if (!cancelled) {
        setAsyncTokens(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [code3, language]);
  const tokenized = asyncTokens ?? syncTokens;
  return /* @__PURE__ */ jsx23("div", { className: "relative overflow-auto", children: /* @__PURE__ */ jsx23(CodeBlockBody, { showLineNumbers, tokenized }) });
};
var CodeBlock = ({
  code: code3,
  language,
  showLineNumbers = false,
  className,
  children,
  ...props
}) => {
  const contextValue = useMemo6(() => ({ code: code3 }), [code3]);
  return /* @__PURE__ */ jsx23(CodeBlockContext.Provider, { value: contextValue, children: /* @__PURE__ */ jsxs13(CodeBlockContainer, { className, language, ...props, children: [
    children,
    /* @__PURE__ */ jsx23(
      CodeBlockContent,
      {
        code: code3,
        language,
        showLineNumbers
      }
    )
  ] }) });
};

// src/components/shared/message-box.tsx
import { jsx as jsx24, jsxs as jsxs14 } from "react/jsx-runtime";
function formatEventTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
}
function renderEventContent(event, eventRenderers) {
  for (const renderEvent of eventRenderers) {
    const rendered = renderEvent(event);
    if (rendered) {
      return rendered;
    }
  }
  return null;
}
function MessageStatus({ message }) {
  const statusHistory = message.statusHistory ?? [];
  const statusLabel = message.status ?? "Idle";
  const indicator = message.isWorking ? /* @__PURE__ */ jsx24(Spinner, { className: "size-3", "aria-hidden": "true" }) : /* @__PURE__ */ jsx24("span", { className: "size-2 rounded-full bg-muted-foreground/60", "aria-hidden": "true" });
  if (statusHistory.length <= 1) {
    return /* @__PURE__ */ jsxs14("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
      indicator,
      /* @__PURE__ */ jsx24("span", { className: "truncate", children: statusLabel })
    ] });
  }
  return /* @__PURE__ */ jsxs14(Task, { defaultOpen: false, children: [
    /* @__PURE__ */ jsx24(TaskTrigger, { title: statusLabel, children: /* @__PURE__ */ jsxs14("div", { className: "flex w-full cursor-pointer items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground", children: [
      indicator,
      /* @__PURE__ */ jsx24("span", { className: "truncate", children: statusLabel }),
      /* @__PURE__ */ jsxs14("span", { className: "text-[11px]", children: [
        "(",
        statusHistory.length,
        ")"
      ] })
    ] }) }),
    /* @__PURE__ */ jsx24(TaskContent, { children: statusHistory.map((statusItem) => /* @__PURE__ */ jsxs14(TaskItem, { className: "flex items-center gap-2 text-xs", children: [
      /* @__PURE__ */ jsx24("span", { className: "font-mono opacity-80", children: formatEventTime(statusItem.at) }),
      /* @__PURE__ */ jsx24("span", { children: statusItem.label })
    ] }, statusItem.id)) })
  ] });
}
function MessageEventTimeline({
  events,
  eventRenderers
}) {
  return /* @__PURE__ */ jsxs14(ChainOfThought, { defaultOpen: false, children: [
    /* @__PURE__ */ jsxs14(ChainOfThoughtHeader, { children: [
      "Event Timeline (",
      events.length,
      ")"
    ] }),
    /* @__PURE__ */ jsx24(ChainOfThoughtContent, { children: events.map((eventItem) => {
      const customContent = renderEventContent(eventItem, eventRenderers);
      return /* @__PURE__ */ jsx24(
        ChainOfThoughtStep,
        {
          label: `${eventItem.kind}: ${eventItem.summary}`,
          description: eventItem.details ? `${formatEventTime(eventItem.at)} \u2014 ${eventItem.details}` : formatEventTime(eventItem.at),
          children: customContent ? /* @__PURE__ */ jsx24("div", { className: "min-w-0", children: customContent }) : eventItem.raw ? /* @__PURE__ */ jsx24(CodeBlock, { code: eventItem.raw, language: "json", className: "text-[10px]" }) : null
        },
        eventItem.id
      );
    }) })
  ] });
}
function MessageBox({ messages, eventRenderers = [], className }) {
  return /* @__PURE__ */ jsxs14(
    Conversation,
    {
      className: cn("h-72 rounded-md border border-border bg-background", className),
      children: [
        /* @__PURE__ */ jsx24(ConversationContent, { className: "gap-3 p-3", children: messages.length === 0 ? /* @__PURE__ */ jsx24(
          ConversationEmptyState,
          {
            icon: /* @__PURE__ */ jsx24(MessageSquareIcon, { className: "size-10", "aria-hidden": "true" }),
            title: "No messages yet",
            description: "Send a task to the agent to get started"
          }
        ) : messages.map((message) => {
          const isUser = message.role === "user";
          const timelineEvents = message.events ?? [];
          if (isUser) {
            if (message.text.trim().length === 0) {
              return null;
            }
            return /* @__PURE__ */ jsx24(Message, { from: "user", children: /* @__PURE__ */ jsx24(MessageContent, { children: /* @__PURE__ */ jsx24(MessageResponse, { children: message.text }) }) }, message.id);
          }
          return /* @__PURE__ */ jsxs14(Message, { from: "assistant", children: [
            /* @__PURE__ */ jsx24(MessageStatus, { message }),
            timelineEvents.length > 0 ? /* @__PURE__ */ jsx24(
              MessageEventTimeline,
              {
                events: timelineEvents,
                eventRenderers
              }
            ) : null,
            message.thinkingText && message.thinkingText.trim().length > 0 ? /* @__PURE__ */ jsxs14(Reasoning, { className: "w-full", isStreaming: message.isWorking === true, children: [
              /* @__PURE__ */ jsx24(ReasoningTrigger, {}),
              /* @__PURE__ */ jsx24(ReasoningContent, { children: message.thinkingText })
            ] }) : null,
            message.text.trim().length > 0 ? /* @__PURE__ */ jsx24(MessageContent, { children: /* @__PURE__ */ jsx24(MessageResponse, { children: message.text }) }) : null
          ] }, message.id);
        }) }),
        /* @__PURE__ */ jsx24(ConversationScrollButton, {})
      ]
    }
  );
}

// src/components/ui/card.tsx
import "react";
import { jsx as jsx25 } from "react/jsx-runtime";
function Card({
  className,
  size = "default",
  ...props
}) {
  return /* @__PURE__ */ jsx25(
    "div",
    {
      "data-slot": "card",
      "data-size": size,
      className: cn(
        "group/card flex flex-col gap-4 overflow-hidden rounded-lg bg-card py-4 text-xs/relaxed text-card-foreground ring-1 ring-foreground/10 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 *:[img:first-child]:rounded-t-lg *:[img:last-child]:rounded-b-lg",
        className
      ),
      ...props
    }
  );
}
function CardHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx25(
    "div",
    {
      "data-slot": "card-header",
      className: cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-lg px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className
      ),
      ...props
    }
  );
}
function CardTitle({ className, ...props }) {
  return /* @__PURE__ */ jsx25(
    "div",
    {
      "data-slot": "card-title",
      className: cn("text-sm font-medium", className),
      ...props
    }
  );
}
function CardDescription({ className, ...props }) {
  return /* @__PURE__ */ jsx25(
    "div",
    {
      "data-slot": "card-description",
      className: cn("text-xs/relaxed text-muted-foreground", className),
      ...props
    }
  );
}
function CardContent({ className, ...props }) {
  return /* @__PURE__ */ jsx25(
    "div",
    {
      "data-slot": "card-content",
      className: cn("px-4 group-data-[size=sm]/card:px-3", className),
      ...props
    }
  );
}

// src/a2a/use-a2a-chat.ts
import React13 from "react";
import { Effect as Effect2 } from "effect";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// src/a2a/helpers.ts
import { AGENT_CARD_PATH } from "@a2a-js/sdk";
import { Client, JsonRpcTransport } from "@a2a-js/sdk/client";

// src/a2a/proxy.ts
var DEFAULT_PROXY_BASE_PATH = "/api/a2a";
function normalizeProxyBasePath(basePath) {
  const rawPath = (basePath ?? DEFAULT_PROXY_BASE_PATH).trim();
  if (!rawPath.startsWith("/")) {
    return `/${rawPath.replace(/\/+$/, "")}`;
  }
  return rawPath.replace(/\/+$/, "");
}
function createProxyTransport(basePath) {
  if (!basePath) {
    return {
      mode: "direct"
    };
  }
  return {
    mode: "proxy",
    basePath: normalizeProxyBasePath(basePath)
  };
}
function createAgentCardProxyUrl(transport, targetUrl) {
  if (transport.mode === "direct") {
    return targetUrl;
  }
  const params = new URLSearchParams({ target: targetUrl });
  return `${transport.basePath}/agent-card?${params.toString()}`;
}
function createJsonRpcProxyUrl(transport, endpoint) {
  if (transport.mode === "direct") {
    return endpoint;
  }
  const params = new URLSearchParams({ target: endpoint });
  return `${transport.basePath}/jsonrpc?${params.toString()}`;
}

// src/a2a/helpers.ts
var JSON_RPC_TRANSPORT = "JSONRPC";
function createId(prefix) {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
function normalizeBaseUrl(url) {
  const rawUrl = url.trim();
  const withProtocol = /^https?:\/\//i.test(rawUrl) ? rawUrl : `http://${rawUrl}`;
  return withProtocol.replace(/\/$/, "");
}
function isRecord(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function resolveEndpointUrl(baseUrl, url) {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(url, normalizedBaseUrl).toString();
}
function resolveJsonRpcEndpoint(baseUrl, agentCard) {
  if (!isRecord(agentCard)) {
    return baseUrl;
  }
  const card = agentCard;
  const interfaces = [
    ...Array.isArray(card.supportedInterfaces) ? card.supportedInterfaces : [],
    ...Array.isArray(card.additionalInterfaces) ? card.additionalInterfaces : []
  ];
  for (const item of interfaces) {
    if (!isRecord(item) || typeof item.url !== "string") {
      continue;
    }
    const binding = typeof item.transport === "string" ? item.transport : typeof item.protocolBinding === "string" ? item.protocolBinding : null;
    if (binding !== JSON_RPC_TRANSPORT) {
      continue;
    }
    return resolveEndpointUrl(baseUrl, item.url);
  }
  if (typeof card.url === "string" && card.url.length > 0) {
    return resolveEndpointUrl(baseUrl, card.url);
  }
  return baseUrl;
}
async function createJsonRpcClient(baseUrl, transport) {
  const cardUrl = transport.mode === "proxy" ? createAgentCardProxyUrl(transport, baseUrl) : `${normalizeBaseUrl(baseUrl)}/${AGENT_CARD_PATH}`;
  const cardResponse = await fetch(cardUrl);
  if (!cardResponse.ok) {
    throw new Error(`Could not fetch agent card (${cardResponse.status})`);
  }
  const agentCard = await cardResponse.json();
  const upstreamEndpoint = resolveJsonRpcEndpoint(baseUrl, agentCard);
  const endpoint = transport.mode === "proxy" ? createJsonRpcProxyUrl(transport, upstreamEndpoint) : baseUrl;
  const client = new Client(new JsonRpcTransport({ endpoint }), agentCard);
  const agentName = typeof agentCard.name === "string" ? agentCard.name : null;
  const acceptedOutputModes = Array.isArray(agentCard.defaultOutputModes) ? agentCard.defaultOutputModes.filter(
    (mode) => typeof mode === "string" && mode.length > 0
  ) : [];
  return { client, agentName, endpoint, acceptedOutputModes };
}
function buildA2AMessage(text, conversationState) {
  return {
    kind: "message",
    messageId: createId("msg"),
    role: "user",
    parts: [{ kind: "text", text }],
    contextId: conversationState.contextId
  };
}
function extractTextFromParts(parts) {
  if (!Array.isArray(parts)) {
    return [];
  }
  return parts.flatMap((part) => {
    if (!isRecord(part)) {
      return [];
    }
    if (part.kind === "text" && typeof part.text === "string" && part.text.trim().length > 0) {
      return [part.text];
    }
    if (typeof part.kind === "undefined" && typeof part.text === "string" && part.text.trim().length > 0) {
      return [part.text];
    }
    if (part.part_kind === "text" && typeof part.content === "string" && part.content.trim().length > 0) {
      return [part.content];
    }
    return [];
  });
}
function getTaskText(task, streamNotes = []) {
  const statusNotes = task.status.message && Array.isArray(task.status.message.parts) ? extractTextFromParts(task.status.message.parts) : [];
  const historyNotes = task.history?.flatMap(
    (message) => message.role === "agent" ? extractTextFromParts(message.parts) : []
  ) ?? [];
  const fragments = [
    ...statusNotes,
    ...historyNotes,
    ...streamNotes
  ].map((fragment) => fragment.trim()).filter((fragment) => fragment.length > 0);
  return Array.from(new Set(fragments)).join("\n\n");
}
function extractTask(value) {
  const normalizeTask = (candidate) => {
    const directState = isRecord(candidate.status) && typeof candidate.status.state === "string" ? candidate.status.state : null;
    if (typeof candidate.id !== "string" || !directState) {
      return null;
    }
    const contextId = typeof candidate.contextId === "string" ? candidate.contextId : typeof candidate.context_id === "string" ? candidate.context_id : void 0;
    const taskCandidate = candidate;
    if (typeof contextId !== "string") {
      return taskCandidate;
    }
    return {
      ...taskCandidate,
      contextId
    };
  };
  if (!isRecord(value)) {
    return null;
  }
  const directTask = normalizeTask(value);
  if (directTask) {
    return directTask;
  }
  const nested = value.task;
  if (isRecord(nested)) {
    const nestedTask = normalizeTask(nested);
    if (nestedTask) {
      return nestedTask;
    }
  }
  const result = value.result;
  if (isRecord(result)) {
    const directResultTask = normalizeTask(result);
    if (directResultTask) {
      return directResultTask;
    }
    const nestedResultTask = result.task;
    if (isRecord(nestedResultTask)) {
      const normalizedNestedResultTask = normalizeTask(nestedResultTask);
      if (normalizedNestedResultTask) {
        return normalizedNestedResultTask;
      }
    }
  }
  return null;
}

// src/a2a/service.ts
import { Effect } from "effect";
var connectJsonRpc = (baseUrl, transport) => Effect.tryPromise({
  try: () => createJsonRpcClient(baseUrl, transport),
  catch: (cause) => cause instanceof Error ? cause : new Error("Could not connect to the A2A server")
});
var sendTaskMessageStream = (client, params, signal) => Effect.sync(() => client.sendMessageStream(params, { signal }));
var resubscribeToTask = (client, taskId, signal) => Effect.sync(() => client.resubscribeTask({ id: taskId }, { signal }));
var getTaskById = (client, taskId) => Effect.tryPromise({
  try: () => client.getTask({ id: taskId }),
  catch: (cause) => cause instanceof Error ? cause : new Error("Could not fetch task from A2A server")
});

// src/a2a/use-a2a-chat.ts
var connectionKey = ["a2a", "connection"];
var chatKey = ["a2a", "chat"];
var TERMINAL_STATES = /* @__PURE__ */ new Set(["completed", "failed", "canceled", "rejected"]);
var DEFAULT_TASK_TITLE = "New Task";
function isTerminalTask(task) {
  return TERMINAL_STATES.has(task.status.state);
}
function formatTaskStatus(status) {
  return status.split(/[-_\s]+/).filter((token) => token.length > 0).map((token) => token.charAt(0).toUpperCase() + token.slice(1)).join(" ");
}
function getErrorMessage(error, fallback) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }
  return fallback;
}
function extractResponseMessageText(response) {
  if (isRecord(response) && Array.isArray(response.parts)) {
    return extractTextFromParts(response.parts).join("\n");
  }
  if (isRecord(response) && isRecord(response.result) && Array.isArray(response.result.parts)) {
    return extractTextFromParts(response.result.parts).join("\n");
  }
  return "";
}
function normalizeStreamEvent(event) {
  if (!isRecord(event)) {
    return event;
  }
  if (isRecord(event.task)) {
    return event.task;
  }
  if (isRecord(event.statusUpdate)) {
    return {
      kind: "status-update",
      ...event.statusUpdate
    };
  }
  if (isRecord(event.artifactUpdate)) {
    return {
      kind: "artifact-update",
      ...event.artifactUpdate
    };
  }
  return event;
}
function getStatusUpdateEvent(event) {
  const normalized = normalizeStreamEvent(event);
  if (!isRecord(normalized) || normalized.kind !== "status-update" || !isRecord(normalized.status)) {
    return null;
  }
  return {
    kind: "status-update",
    taskId: typeof normalized.taskId === "string" ? normalized.taskId : typeof normalized.task_id === "string" ? normalized.task_id : void 0,
    status: normalized.status
  };
}
function getArtifactUpdateEvent(event) {
  const normalized = normalizeStreamEvent(event);
  if (!isRecord(normalized) || normalized.kind !== "artifact-update") {
    return null;
  }
  return {
    kind: "artifact-update",
    taskId: typeof normalized.taskId === "string" ? normalized.taskId : typeof normalized.task_id === "string" ? normalized.task_id : void 0,
    artifact: isRecord(normalized.artifact) ? {
      parts: normalized.artifact.parts
    } : void 0,
    lastChunk: normalized.lastChunk === true
  };
}
function extractAssistantTextFromArtifactUpdate(event) {
  const parts = event.artifact?.parts;
  const fragments = extractTextFromParts(parts);
  const outputChunks = [];
  let outputSnapshot = null;
  const thinkingChunks = [];
  for (const fragment of fragments) {
    const payload = fragment.trim();
    if (payload.length === 0) {
      continue;
    }
    try {
      const parsed = JSON.parse(payload);
      if (!isRecord(parsed)) {
        continue;
      }
      if (parsed.event_kind === "agent_run_result" && typeof parsed.output === "string") {
        outputSnapshot = parsed.output;
        continue;
      }
      if (parsed.event_kind === "part_end" && isRecord(parsed.part)) {
        if (parsed.part.part_kind === "text" && typeof parsed.part.content === "string") {
          outputChunks.push(parsed.part.content);
          continue;
        }
        if (parsed.part.part_kind === "thinking" && typeof parsed.part.content === "string") {
          thinkingChunks.push(parsed.part.content);
        }
      }
    } catch {
      outputChunks.push(fragment);
    }
  }
  return {
    outputChunks,
    outputSnapshot,
    thinkingChunks
  };
}
function getConnectionInitialState() {
  return {
    state: "idle",
    message: "Not connected",
    client: null,
    connectedUrl: null,
    pendingUrl: null,
    acceptedOutputModes: ["application/json"],
    agentName: null
  };
}
function createTaskSession(title = DEFAULT_TASK_TITLE) {
  const now = Date.now();
  return {
    id: createId("task"),
    title,
    messages: [],
    conversationState: {},
    createdAt: now,
    updatedAt: now
  };
}
function getUrlChatInitialState() {
  const firstSession = createTaskSession();
  return {
    activeSessionId: firstSession.id,
    sessions: [firstSession],
    agentName: null,
    lastConnectedAt: null
  };
}
function getChatInitialState() {
  return {
    byUrl: {}
  };
}
function createResubscribeSignal(controller, timeoutMs) {
  const timeoutController = new AbortController();
  const timeoutId = globalThis.setTimeout(() => timeoutController.abort(), timeoutMs);
  const onAbort = () => timeoutController.abort();
  controller.signal.addEventListener("abort", onAbort, { once: true });
  return {
    signal: timeoutController.signal,
    release: () => {
      globalThis.clearTimeout(timeoutId);
      controller.signal.removeEventListener("abort", onAbort);
    }
  };
}
function getSessionTitleFromText(text) {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (normalized.length === 0) {
    return DEFAULT_TASK_TITLE;
  }
  return normalized.length > 36 ? `${normalized.slice(0, 33)}...` : normalized;
}
function truncateText(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
}
function safeSerialize(value) {
  try {
    const serialized = JSON.stringify(value, null, 2);
    return truncateText(serialized, 4e3);
  } catch {
    return void 0;
  }
}
function summarizeArtifactParts(parts) {
  if (!Array.isArray(parts) || parts.length === 0) {
    return { summary: "No artifact parts in update." };
  }
  const fragments = [];
  for (const part of parts) {
    if (!isRecord(part) || typeof part.kind !== "string") {
      continue;
    }
    if (part.kind === "text") {
      const value = typeof part.text === "string" ? part.text.trim() : "";
      fragments.push(value.length > 0 ? `text: ${truncateText(value, 80)}` : "text: [empty]");
      continue;
    }
    if (part.kind === "data") {
      const value = safeSerialize(part.data);
      fragments.push(value ? `data: ${truncateText(value.replace(/\s+/g, " "), 80)}` : "data");
      continue;
    }
    if (part.kind === "file") {
      const fileName = isRecord(part.file) && typeof part.file.name === "string" ? part.file.name : "file";
      fragments.push(`file: ${fileName}`);
      continue;
    }
    fragments.push(`part: ${part.kind}`);
  }
  if (fragments.length === 0) {
    return { summary: `${parts.length} part(s)` };
  }
  const summary = truncateText(fragments.join(" | "), 180);
  return {
    summary,
    details: `parts: ${parts.length}`
  };
}
function getFirstDataPart(parts) {
  if (!Array.isArray(parts)) {
    return null;
  }
  for (const part of parts) {
    if (isRecord(part) && part.kind === "data" && isRecord(part.data)) {
      return part.data;
    }
  }
  return null;
}
function summarizeStatusUpdateEvent(event) {
  if (!isRecord(event.status) || !isRecord(event.status.message)) {
    return null;
  }
  const data = getFirstDataPart(event.status.message.parts);
  if (!data || typeof data.type !== "string") {
    return null;
  }
  return summarizeToolData(data);
}
function getLatestAgentDataPartFromTask(task) {
  const history = Array.isArray(task.history) ? task.history : [];
  for (const message of [...history].reverse()) {
    if (!isRecord(message) || message.role !== "agent") {
      continue;
    }
    const data = getFirstDataPart(message.parts);
    if (data) {
      return data;
    }
  }
  return null;
}
function summarizeToolData(data) {
  if (typeof data.type !== "string") {
    return null;
  }
  const toolName = typeof data.toolName === "string" ? data.toolName : "tool";
  if (data.type === "tool-call") {
    return `Calling ${toolName}.`;
  }
  if (data.type === "tool-result") {
    return `Received ${toolName} result.`;
  }
  if (data.type === "finish-step" && typeof data.finishReason === "string") {
    return `Finished model step: ${data.finishReason}.`;
  }
  if (data.type === "finish" && typeof data.finishReason === "string") {
    return `Finished run: ${data.finishReason}.`;
  }
  return null;
}
function buildTimelineEvent(event) {
  const normalizedEvent = normalizeStreamEvent(event);
  const raw = safeSerialize(normalizedEvent);
  const task = extractTask(normalizedEvent);
  if (task) {
    const state = formatTaskStatus(task.status.state);
    const taskSummary = summarizeToolData(getLatestAgentDataPartFromTask(task) ?? {});
    return {
      kind: "task-update",
      summary: taskSummary ?? `Task ${task.id} is ${state}.`,
      details: task.contextId ? `contextId: ${task.contextId}` : void 0,
      raw,
      rawEvent: normalizedEvent
    };
  }
  if (isRecord(normalizedEvent) && typeof normalizedEvent.kind === "string") {
    if (normalizedEvent.kind === "status-update") {
      const statusState = isRecord(normalizedEvent.status) && typeof normalizedEvent.status.state === "string" ? formatTaskStatus(normalizedEvent.status.state) : "Unknown";
      const statusSummary = summarizeStatusUpdateEvent(normalizedEvent);
      return {
        kind: "status-update",
        summary: statusSummary ?? `Status changed to ${statusState}.`,
        details: typeof normalizedEvent.taskId === "string" ? `taskId: ${normalizedEvent.taskId}` : void 0,
        raw,
        rawEvent: normalizedEvent
      };
    }
    if (normalizedEvent.kind === "artifact-update") {
      const parts = isRecord(normalizedEvent.artifact) && Array.isArray(normalizedEvent.artifact.parts) ? normalizedEvent.artifact.parts : [];
      const artifactSummary = summarizeArtifactParts(parts);
      return {
        kind: "artifact-update",
        summary: artifactSummary.summary,
        details: artifactSummary.details,
        raw,
        rawEvent: normalizedEvent
      };
    }
    return {
      kind: normalizedEvent.kind,
      summary: "Received event payload.",
      raw,
      rawEvent: normalizedEvent
    };
  }
  return {
    kind: "event",
    summary: "Received event payload.",
    raw,
    rawEvent: normalizedEvent
  };
}
function createStatusEntry(label) {
  return {
    id: createId("status"),
    label,
    at: Date.now()
  };
}
function useA2AChat(options = {}) {
  const {
    initialUrl = "http://localhost:8000",
    proxyBasePath,
    autoConnect = false,
    persistence
  } = options;
  const queryClient = useQueryClient();
  const [url, setUrl] = React13.useState(initialUrl);
  const [taskInput, setTaskInput] = React13.useState("");
  const runnerControllersRef = React13.useRef(/* @__PURE__ */ new Map());
  const didAutoConnectRef = React13.useRef(/* @__PURE__ */ new Set());
  const baseUrl = React13.useMemo(() => normalizeBaseUrl(url), [url]);
  const transport = React13.useMemo(() => createProxyTransport(proxyBasePath), [proxyBasePath]);
  const connectionQuery = useQuery({
    queryKey: connectionKey,
    queryFn: async () => getConnectionInitialState(),
    initialData: getConnectionInitialState,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY
  });
  const chatQuery = useQuery({
    queryKey: chatKey,
    queryFn: async () => getChatInitialState(),
    initialData: getChatInitialState,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY
  });
  const setConnectionStore = React13.useCallback(
    (updater) => {
      queryClient.setQueryData(
        connectionKey,
        (current) => updater(current ?? getConnectionInitialState())
      );
    },
    [queryClient]
  );
  const setChatStore = React13.useCallback(
    (updater) => {
      queryClient.setQueryData(chatKey, (current) => updater(current ?? getChatInitialState()));
    },
    [queryClient]
  );
  const ensureUrlChatState = React13.useCallback(
    (urlKey) => {
      setChatStore((current) => {
        if (current.byUrl[urlKey]) {
          return current;
        }
        return {
          ...current,
          byUrl: {
            ...current.byUrl,
            [urlKey]: getUrlChatInitialState()
          }
        };
      });
    },
    [setChatStore]
  );
  const updateTaskSession = React13.useCallback(
    (urlKey, sessionId, updater) => {
      setChatStore((current) => {
        const urlState = current.byUrl[urlKey];
        if (!urlState) {
          return current;
        }
        let didUpdate = false;
        const nextSessions = urlState.sessions.map((session) => {
          if (session.id !== sessionId) {
            return session;
          }
          didUpdate = true;
          const updatedSession = updater(session);
          if (updatedSession.updatedAt === session.updatedAt) {
            return {
              ...updatedSession,
              updatedAt: Date.now()
            };
          }
          return updatedSession;
        });
        if (!didUpdate) {
          return current;
        }
        return {
          ...current,
          byUrl: {
            ...current.byUrl,
            [urlKey]: {
              ...urlState,
              sessions: nextSessions
            }
          }
        };
      });
    },
    [setChatStore]
  );
  const hydratePersistedSessions = React13.useCallback(
    async (urlKey) => {
      if (!persistence) {
        return;
      }
      const persistedSessions = await persistence.loadSessions({ url: urlKey });
      if (persistedSessions.length === 0) {
        ensureUrlChatState(urlKey);
        return;
      }
      setChatStore((current) => {
        const urlState = current.byUrl[urlKey] ?? getUrlChatInitialState();
        const existingById = new Map(urlState.sessions.map((session) => [session.id, session]));
        const nextSessions = persistedSessions.map((session) => ({
          ...existingById.get(session.id) ?? {},
          ...session
        }));
        const activeSessionId = nextSessions.some((session) => session.id === urlState.activeSessionId) ? urlState.activeSessionId : nextSessions[0]?.id ?? urlState.activeSessionId;
        return {
          ...current,
          byUrl: {
            ...current.byUrl,
            [urlKey]: {
              ...urlState,
              activeSessionId,
              sessions: nextSessions
            }
          }
        };
      });
    },
    [ensureUrlChatState, persistence, setChatStore]
  );
  const updateAssistantMessage = React13.useCallback(
    (urlKey, sessionId, messageId, updater) => {
      updateTaskSession(urlKey, sessionId, (currentSession) => ({
        ...currentSession,
        messages: currentSession.messages.map((item) => {
          if (item.id !== messageId || item.role !== "assistant") {
            return item;
          }
          return updater(item);
        })
      }));
    },
    [updateTaskSession]
  );
  const setAssistantStatus = React13.useCallback(
    (urlKey, sessionId, messageId, nextStatus, isWorking) => {
      updateAssistantMessage(urlKey, sessionId, messageId, (currentMessage) => {
        const statusHistory = currentMessage.statusHistory ?? [];
        const lastStatus = statusHistory.at(-1)?.label;
        const nextStatusHistory = lastStatus === nextStatus ? statusHistory : [...statusHistory, createStatusEntry(nextStatus)];
        return {
          ...currentMessage,
          status: nextStatus,
          isWorking,
          statusHistory: nextStatusHistory
        };
      });
    },
    [updateAssistantMessage]
  );
  const appendAssistantEvent = React13.useCallback(
    (urlKey, sessionId, messageId, event) => {
      updateAssistantMessage(urlKey, sessionId, messageId, (currentMessage) => ({
        ...currentMessage,
        events: [
          ...currentMessage.events ?? [],
          {
            ...event,
            id: createId("evt"),
            at: Date.now()
          }
        ]
      }));
    },
    [updateAssistantMessage]
  );
  const hydrateTaskOutput = React13.useCallback(
    async (client, urlKey, sessionId, assistantMessageId, taskId) => {
      try {
        const snapshot = await Effect2.runPromise(getTaskById(client, taskId));
        const snapshotText = getTaskText(snapshot);
        appendAssistantEvent(urlKey, sessionId, assistantMessageId, {
          kind: "task-snapshot",
          summary: "Fetched final task snapshot.",
          raw: safeSerialize(snapshot),
          rawEvent: snapshot
        });
        if (snapshotText.length > 0) {
          updateAssistantMessage(urlKey, sessionId, assistantMessageId, (currentMessage) => ({
            ...currentMessage,
            text: snapshotText
          }));
        }
        return snapshot;
      } catch (error) {
        appendAssistantEvent(urlKey, sessionId, assistantMessageId, {
          kind: "task-snapshot-error",
          summary: getErrorMessage(error, "Could not fetch final task snapshot.")
        });
        return null;
      }
    },
    [appendAssistantEvent, updateAssistantMessage]
  );
  const processTaskStreamEvent = React13.useCallback(
    async (client, urlKey, sessionId, assistantMessageId, currentTask, event) => {
      const artifactUpdate = getArtifactUpdateEvent(event);
      if (!artifactUpdate) {
        appendAssistantEvent(urlKey, sessionId, assistantMessageId, buildTimelineEvent(event));
      }
      const taskEvent = extractTask(normalizeStreamEvent(event));
      if (taskEvent) {
        updateTaskSession(urlKey, sessionId, (currentSession) => ({
          ...currentSession,
          conversationState: {
            contextId: taskEvent.contextId,
            taskId: taskEvent.id
          }
        }));
        updateAssistantMessage(urlKey, sessionId, assistantMessageId, (currentMessage) => ({
          ...currentMessage,
          text: getTaskText(taskEvent)
        }));
        setAssistantStatus(
          urlKey,
          sessionId,
          assistantMessageId,
          formatTaskStatus(taskEvent.status.state),
          !isTerminalTask(taskEvent)
        );
        if (isTerminalTask(taskEvent)) {
          const snapshot = await hydrateTaskOutput(
            client,
            urlKey,
            sessionId,
            assistantMessageId,
            taskEvent.id
          );
          return { task: snapshot ?? taskEvent, done: true };
        }
        return { task: taskEvent, done: false };
      }
      if (!currentTask) {
        return { task: null, done: false };
      }
      if (artifactUpdate && artifactUpdate.taskId === currentTask.id) {
        const { outputChunks, outputSnapshot, thinkingChunks } = extractAssistantTextFromArtifactUpdate(artifactUpdate);
        if (outputSnapshot !== null || outputChunks.length > 0 || thinkingChunks.length > 0) {
          updateAssistantMessage(urlKey, sessionId, assistantMessageId, (currentMessage) => {
            const nextText = outputSnapshot ?? `${currentMessage.text}${outputChunks.join("")}`;
            const nextThinkingText = `${currentMessage.thinkingText ?? ""}${thinkingChunks.join("")}`;
            return {
              ...currentMessage,
              text: nextText,
              thinkingText: nextThinkingText.length > 0 ? nextThinkingText : currentMessage.thinkingText
            };
          });
        }
        if (artifactUpdate.lastChunk) {
          const snapshot = await hydrateTaskOutput(
            client,
            urlKey,
            sessionId,
            assistantMessageId,
            currentTask.id
          );
          if (snapshot) {
            setAssistantStatus(
              urlKey,
              sessionId,
              assistantMessageId,
              formatTaskStatus(snapshot.status.state),
              !isTerminalTask(snapshot)
            );
            return { task: snapshot, done: isTerminalTask(snapshot) };
          }
        }
        return { task: currentTask, done: false };
      }
      const statusUpdate = getStatusUpdateEvent(event);
      if (statusUpdate && statusUpdate.taskId === currentTask.id) {
        const nextTask = {
          ...currentTask,
          status: statusUpdate.status
        };
        updateAssistantMessage(urlKey, sessionId, assistantMessageId, (currentMessage) => ({
          ...currentMessage,
          text: getTaskText(nextTask)
        }));
        setAssistantStatus(
          urlKey,
          sessionId,
          assistantMessageId,
          formatTaskStatus(nextTask.status.state),
          !isTerminalTask(nextTask)
        );
        if (isTerminalTask(nextTask)) {
          const snapshot = await hydrateTaskOutput(
            client,
            urlKey,
            sessionId,
            assistantMessageId,
            nextTask.id
          );
          return { task: snapshot ?? nextTask, done: true };
        }
        return { task: nextTask, done: false };
      }
      return { task: currentTask, done: false };
    },
    [
      appendAssistantEvent,
      hydrateTaskOutput,
      setAssistantStatus,
      updateAssistantMessage,
      updateTaskSession
    ]
  );
  const startTaskResubscribeLoop = React13.useCallback(
    (client, urlKey, sessionId, initialTask, assistantMessageId) => {
      const controllerKey = `${urlKey}::${initialTask.id}`;
      const existing = runnerControllersRef.current.get(controllerKey);
      if (existing) {
        existing.abort();
      }
      const controller = new AbortController();
      runnerControllersRef.current.set(controllerKey, controller);
      void (async () => {
        let currentTask = initialTask;
        for (let attempt = 0; attempt < 120; attempt += 1) {
          if (controller.signal.aborted || isTerminalTask(currentTask)) {
            break;
          }
          const { signal, release } = createResubscribeSignal(controller, 3e3);
          try {
            const stream = await Effect2.runPromise(resubscribeToTask(client, currentTask.id, signal));
            for await (const event of stream) {
              if (controller.signal.aborted) {
                break;
              }
              const result = await processTaskStreamEvent(
                client,
                urlKey,
                sessionId,
                assistantMessageId,
                currentTask,
                event
              );
              if (result.task) {
                currentTask = result.task;
              }
              if (result.done) {
                break;
              }
            }
          } catch {
          } finally {
            release();
          }
          if (controller.signal.aborted || isTerminalTask(currentTask)) {
            break;
          }
          await Effect2.runPromise(Effect2.sleep(600));
        }
        if (!controller.signal.aborted && !isTerminalTask(currentTask)) {
          setAssistantStatus(urlKey, sessionId, assistantMessageId, "Waiting For Events", true);
        }
        runnerControllersRef.current.delete(controllerKey);
      })();
    },
    [processTaskStreamEvent, setAssistantStatus]
  );
  React13.useEffect(() => {
    return () => {
      for (const controller of runnerControllersRef.current.values()) {
        controller.abort();
      }
      runnerControllersRef.current.clear();
    };
  }, []);
  const connectMutation = useMutation({
    mutationFn: async (targetUrl) => Effect2.runPromise(connectJsonRpc(targetUrl, transport)),
    onMutate: (targetUrl) => {
      ensureUrlChatState(targetUrl);
      setConnectionStore((current) => ({
        ...current,
        state: "connecting",
        message: `Checking ${targetUrl}...`,
        client: null,
        connectedUrl: null,
        pendingUrl: targetUrl,
        acceptedOutputModes: ["application/json"],
        agentName: null
      }));
    },
    onSuccess: ({ client, endpoint, acceptedOutputModes, agentName }, targetUrl) => {
      setChatStore((current) => {
        const urlState = current.byUrl[targetUrl] ?? getUrlChatInitialState();
        return {
          ...current,
          byUrl: {
            ...current.byUrl,
            [targetUrl]: {
              ...urlState,
              agentName: agentName && agentName.trim().length > 0 ? agentName.trim() : null,
              lastConnectedAt: Date.now()
            }
          }
        };
      });
      setConnectionStore((current) => ({
        ...current,
        state: "connected",
        message: `Connected via JSONRPC (${endpoint})`,
        client,
        connectedUrl: targetUrl,
        pendingUrl: null,
        acceptedOutputModes: acceptedOutputModes.length > 0 ? acceptedOutputModes : ["application/json"],
        agentName
      }));
      void hydratePersistedSessions(targetUrl);
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Could not connect to the server");
      setConnectionStore((current) => ({
        ...current,
        state: "error",
        message,
        client: null,
        connectedUrl: null,
        pendingUrl: current.pendingUrl,
        agentName: null
      }));
    }
  });
  const sendTaskMutation = useMutation({
    mutationFn: async (variables) => {
      const connection = queryClient.getQueryData(connectionKey);
      if (!connection || connection.state !== "connected" || !connection.client || connection.connectedUrl !== variables.urlKey) {
        throw new Error("Not connected");
      }
      const chatStore = queryClient.getQueryData(chatKey) ?? getChatInitialState();
      const urlState = chatStore.byUrl[variables.urlKey];
      const targetSession = urlState?.sessions.find((session) => session.id === variables.taskSessionId);
      if (!targetSession) {
        throw new Error("Task session not found");
      }
      const streamController = new AbortController();
      const streamControllerKey = `${variables.urlKey}::${variables.assistantMessageId}`;
      runnerControllersRef.current.set(streamControllerKey, streamController);
      let currentTask = null;
      let directResponseText = "";
      try {
        const payload = buildA2AMessage(variables.taskText, targetSession.conversationState);
        const stream = await Effect2.runPromise(
          sendTaskMessageStream(
            connection.client,
            {
              message: payload,
              configuration: {
                acceptedOutputModes: connection.acceptedOutputModes
              }
            },
            streamController.signal
          )
        );
        for await (const event of stream) {
          if (streamController.signal.aborted) {
            break;
          }
          const eventText = extractResponseMessageText(event);
          if (eventText.length > 0) {
            directResponseText = eventText;
          }
          const result = await processTaskStreamEvent(
            connection.client,
            variables.urlKey,
            variables.taskSessionId,
            variables.assistantMessageId,
            currentTask,
            event
          );
          currentTask = result.task;
          if (currentTask && runnerControllersRef.current.get(streamControllerKey) === streamController) {
            runnerControllersRef.current.delete(streamControllerKey);
            runnerControllersRef.current.set(`${variables.urlKey}::${currentTask.id}`, streamController);
          }
          if (result.done) {
            break;
          }
        }
      } catch (error) {
        if (!streamController.signal.aborted && currentTask && !isTerminalTask(currentTask)) {
          startTaskResubscribeLoop(
            connection.client,
            variables.urlKey,
            variables.taskSessionId,
            currentTask,
            variables.assistantMessageId
          );
          return;
        }
        throw error;
      } finally {
        if (runnerControllersRef.current.get(streamControllerKey) === streamController) {
          runnerControllersRef.current.delete(streamControllerKey);
        }
        if (currentTask && runnerControllersRef.current.get(`${variables.urlKey}::${currentTask.id}`) === streamController) {
          runnerControllersRef.current.delete(`${variables.urlKey}::${currentTask.id}`);
        }
      }
      if (currentTask) {
        return;
      }
      if (directResponseText.length > 0) {
        updateAssistantMessage(
          variables.urlKey,
          variables.taskSessionId,
          variables.assistantMessageId,
          (currentMessage) => ({
            ...currentMessage,
            text: directResponseText
          })
        );
        setAssistantStatus(
          variables.urlKey,
          variables.taskSessionId,
          variables.assistantMessageId,
          "Completed",
          false
        );
        return;
      }
      throw new Error("Task stream ended without returning a task or message.");
    },
    onSuccess: async (_result, variables) => {
      await hydratePersistedSessions(variables.urlKey);
    },
    onMutate: ({ taskText, assistantMessageId, urlKey, taskSessionId }) => {
      updateTaskSession(urlKey, taskSessionId, (currentSession) => ({
        ...currentSession,
        title: currentSession.title === DEFAULT_TASK_TITLE && currentSession.messages.length === 0 ? getSessionTitleFromText(taskText) : currentSession.title,
        messages: [
          ...currentSession.messages,
          { id: createId("msg"), role: "user", text: taskText },
          {
            id: assistantMessageId,
            role: "assistant",
            text: "",
            status: "Sending Task",
            isWorking: true,
            statusHistory: [createStatusEntry("Sending Task")],
            events: []
          }
        ]
      }));
      setTaskInput("");
    },
    onError: (error, variables) => {
      const message = getErrorMessage(
        error,
        "Failed to send task or read task updates from the server."
      );
      updateAssistantMessage(
        variables.urlKey,
        variables.taskSessionId,
        variables.assistantMessageId,
        (currentMessage) => ({
          ...currentMessage,
          text: message
        })
      );
      setAssistantStatus(
        variables.urlKey,
        variables.taskSessionId,
        variables.assistantMessageId,
        "Failed",
        false
      );
    }
  });
  const activeUrlState = chatQuery.data.byUrl[baseUrl] ?? null;
  const recentAgents = React13.useMemo(
    () => Object.entries(chatQuery.data.byUrl).map(([connectedUrl, state]) => ({
      url: connectedUrl,
      agentName: state.agentName,
      lastConnectedAt: state.lastConnectedAt
    })).filter((entry) => entry.lastConnectedAt !== null).sort((a, b) => (b.lastConnectedAt ?? 0) - (a.lastConnectedAt ?? 0)),
    [chatQuery.data.byUrl]
  );
  const activeTaskSession = activeUrlState ? activeUrlState.sessions.find((session) => session.id === activeUrlState.activeSessionId) ?? activeUrlState.sessions[0] ?? null : null;
  const taskSessions = React13.useMemo(
    () => [...activeUrlState?.sessions ?? []].sort((a, b) => b.updatedAt - a.updatedAt).map((session) => ({
      id: session.id,
      title: session.title,
      updatedAt: session.updatedAt
    })),
    [activeUrlState?.sessions]
  );
  const handleConnect = React13.useCallback(() => {
    connectMutation.mutate(baseUrl);
  }, [baseUrl, connectMutation]);
  const handleSelectRecentAgent = React13.useCallback(
    (agentUrl) => {
      setUrl(agentUrl);
      ensureUrlChatState(agentUrl);
    },
    [ensureUrlChatState]
  );
  React13.useEffect(() => {
    if (!autoConnect || connectMutation.isPending || didAutoConnectRef.current.has(baseUrl)) {
      return;
    }
    const connection = connectionQuery.data;
    if (connection.state === "connected" && connection.connectedUrl === baseUrl) {
      return;
    }
    didAutoConnectRef.current.add(baseUrl);
    connectMutation.mutate(baseUrl);
  }, [autoConnect, baseUrl, connectMutation, connectionQuery.data]);
  React13.useEffect(() => {
    void hydratePersistedSessions(baseUrl);
  }, [baseUrl, hydratePersistedSessions]);
  const handleSubmitTask = React13.useCallback(() => {
    const taskText = taskInput.trim();
    const connection = connectionQuery.data;
    if (taskText.length === 0 || sendTaskMutation.isPending || !activeTaskSession || connection.state !== "connected" || connection.connectedUrl !== baseUrl || !connection.client) {
      return;
    }
    sendTaskMutation.mutate({
      taskText,
      assistantMessageId: createId("msg"),
      urlKey: baseUrl,
      taskSessionId: activeTaskSession.id
    });
  }, [activeTaskSession, baseUrl, connectionQuery.data, sendTaskMutation, taskInput]);
  const handleCreateTaskSession = React13.useCallback(() => {
    setChatStore((current) => {
      const urlState = current.byUrl[baseUrl];
      if (!urlState) {
        return current;
      }
      const nextSession = createTaskSession();
      return {
        ...current,
        byUrl: {
          ...current.byUrl,
          [baseUrl]: {
            ...urlState,
            activeSessionId: nextSession.id,
            sessions: [...urlState.sessions, nextSession]
          }
        }
      };
    });
  }, [baseUrl, setChatStore]);
  const handleSelectTaskSession = React13.useCallback(
    (sessionId) => {
      setChatStore((current) => {
        const urlState = current.byUrl[baseUrl];
        if (!urlState || !urlState.sessions.some((session) => session.id === sessionId)) {
          return current;
        }
        if (urlState.activeSessionId === sessionId) {
          return current;
        }
        return {
          ...current,
          byUrl: {
            ...current.byUrl,
            [baseUrl]: {
              ...urlState,
              activeSessionId: sessionId
            }
          }
        };
      });
    },
    [baseUrl, setChatStore]
  );
  const handleDeleteTaskSession = React13.useCallback(
    (sessionId) => {
      const deletePersistedSession = persistence?.deleteSession;
      if (deletePersistedSession) {
        void deletePersistedSession({ url: baseUrl, sessionId });
      }
      setChatStore((current) => {
        const urlState = current.byUrl[baseUrl];
        if (!urlState || !urlState.sessions.some((session) => session.id === sessionId)) {
          return current;
        }
        const remainingSessions = urlState.sessions.filter((session) => session.id !== sessionId);
        if (remainingSessions.length === 0) {
          const nextSession = createTaskSession();
          return {
            ...current,
            byUrl: {
              ...current.byUrl,
              [baseUrl]: {
                ...urlState,
                activeSessionId: nextSession.id,
                sessions: [nextSession]
              }
            }
          };
        }
        const nextActiveSessionId = urlState.activeSessionId === sessionId ? [...remainingSessions].sort((a, b) => b.updatedAt - a.updatedAt)[0]?.id ?? urlState.activeSessionId : urlState.activeSessionId;
        return {
          ...current,
          byUrl: {
            ...current.byUrl,
            [baseUrl]: {
              ...urlState,
              activeSessionId: nextActiveSessionId,
              sessions: remainingSessions
            }
          }
        };
      });
    },
    [baseUrl, persistence, setChatStore]
  );
  const activeConnection = connectionQuery.data;
  const isConnectedToCurrentUrl = activeConnection.state === "connected" && activeConnection.connectedUrl === baseUrl;
  const isConnectingCurrentUrl = activeConnection.state === "connecting" && activeConnection.pendingUrl === baseUrl;
  const isErrorForCurrentUrl = activeConnection.state === "error" && activeConnection.pendingUrl === baseUrl;
  const connectionState = isConnectedToCurrentUrl ? "connected" : isConnectingCurrentUrl ? "connecting" : isErrorForCurrentUrl ? "error" : "idle";
  const connectionMessage = connectionState === "idle" ? "Not connected" : activeConnection.message;
  return {
    url,
    setUrl,
    connectionState,
    connectionMessage,
    agentName: isConnectedToCurrentUrl ? activeConnection.agentName : null,
    taskInput,
    setTaskInput,
    isSending: sendTaskMutation.isPending,
    messages: activeTaskSession?.messages ?? [],
    recentAgents,
    taskSessions,
    activeTaskSessionId: activeTaskSession?.id ?? null,
    handleConnect,
    handleSelectRecentAgent,
    handleSubmitTask,
    handleCreateTaskSession,
    handleSelectTaskSession,
    handleDeleteTaskSession
  };
}

// src/a2a/inspector-event-renderers.tsx
import "react";

// src/components/ai-elements/tool.tsx
import {
  CheckCircleIcon,
  ChevronDownIcon as ChevronDownIcon5,
  CircleIcon,
  ClockIcon,
  WrenchIcon,
  XCircleIcon
} from "lucide-react";
import { isValidElement } from "react";
import { jsx as jsx26, jsxs as jsxs15 } from "react/jsx-runtime";
var Tool = ({ className, ...props }) => /* @__PURE__ */ jsx26(
  Collapsible,
  {
    className: cn("group not-prose mb-4 w-full rounded-md border", className),
    ...props
  }
);
var statusLabels = {
  "approval-requested": "Awaiting Approval",
  "approval-responded": "Responded",
  "input-available": "Running",
  "input-streaming": "Pending",
  "output-available": "Completed",
  "output-denied": "Denied",
  "output-error": "Error"
};
var statusIcons = {
  "approval-requested": /* @__PURE__ */ jsx26(ClockIcon, { className: "size-4 text-yellow-600" }),
  "approval-responded": /* @__PURE__ */ jsx26(CheckCircleIcon, { className: "size-4 text-blue-600" }),
  "input-available": /* @__PURE__ */ jsx26(ClockIcon, { className: "size-4 animate-pulse" }),
  "input-streaming": /* @__PURE__ */ jsx26(CircleIcon, { className: "size-4" }),
  "output-available": /* @__PURE__ */ jsx26(CheckCircleIcon, { className: "size-4 text-green-600" }),
  "output-denied": /* @__PURE__ */ jsx26(XCircleIcon, { className: "size-4 text-orange-600" }),
  "output-error": /* @__PURE__ */ jsx26(XCircleIcon, { className: "size-4 text-red-600" })
};
var getStatusBadge = (status) => /* @__PURE__ */ jsxs15(Badge, { className: "gap-1.5 rounded-full text-xs", variant: "secondary", children: [
  statusIcons[status],
  statusLabels[status]
] });
var ToolHeader = ({
  className,
  title,
  type,
  state,
  toolName,
  ...props
}) => {
  const derivedName = type === "dynamic-tool" ? toolName : type.split("-").slice(1).join("-");
  return /* @__PURE__ */ jsxs15(
    CollapsibleTrigger,
    {
      className: cn(
        "flex w-full items-center justify-between gap-4 p-3",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsxs15("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx26(WrenchIcon, { className: "size-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx26("span", { className: "font-medium text-sm", children: title ?? derivedName }),
          getStatusBadge(state)
        ] }),
        /* @__PURE__ */ jsx26(ChevronDownIcon5, { className: "size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" })
      ]
    }
  );
};
var ToolContent = ({ className, ...props }) => /* @__PURE__ */ jsx26(
  CollapsibleContent,
  {
    className: cn(
      "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 space-y-4 p-4 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
      className
    ),
    ...props
  }
);
var ToolInput = ({ className, input, ...props }) => /* @__PURE__ */ jsxs15("div", { className: cn("space-y-2 overflow-hidden", className), ...props, children: [
  /* @__PURE__ */ jsx26("h4", { className: "font-medium text-muted-foreground text-xs uppercase tracking-wide", children: "Parameters" }),
  /* @__PURE__ */ jsx26("div", { className: "rounded-md bg-muted/50", children: /* @__PURE__ */ jsx26(CodeBlock, { code: JSON.stringify(input, null, 2), language: "json" }) })
] });
var ToolOutput = ({
  className,
  output,
  errorText,
  ...props
}) => {
  if (!(output || errorText)) {
    return null;
  }
  let Output = /* @__PURE__ */ jsx26("div", { children: output });
  if (typeof output === "object" && !isValidElement(output)) {
    Output = /* @__PURE__ */ jsx26(CodeBlock, { code: JSON.stringify(output, null, 2), language: "json" });
  } else if (typeof output === "string") {
    Output = /* @__PURE__ */ jsx26(CodeBlock, { code: output, language: "json" });
  }
  return /* @__PURE__ */ jsxs15("div", { className: cn("space-y-2", className), ...props, children: [
    /* @__PURE__ */ jsx26("h4", { className: "font-medium text-muted-foreground text-xs uppercase tracking-wide", children: errorText ? "Error" : "Result" }),
    /* @__PURE__ */ jsxs15(
      "div",
      {
        className: cn(
          "overflow-x-auto rounded-md text-xs [&_table]:w-full",
          errorText ? "bg-destructive/10 text-destructive" : "bg-muted/50 text-foreground"
        ),
        children: [
          errorText && /* @__PURE__ */ jsx26("div", { children: errorText }),
          Output
        ]
      }
    )
  ] });
};

// src/a2a/inspector-event-renderers.tsx
import { jsx as jsx27, jsxs as jsxs16 } from "react/jsx-runtime";
function isRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function getStatusMessageData(event) {
  const rawEvent = event.rawEvent;
  if (!isRecord2(rawEvent)) {
    return null;
  }
  if (rawEvent.kind === "status-update" && isRecord2(rawEvent.status)) {
    const data = getFirstDataPartFromMessage(rawEvent.status.message);
    if (data) {
      return data;
    }
  }
  if (rawEvent.kind === "task" && Array.isArray(rawEvent.history)) {
    for (const message of [...rawEvent.history].reverse()) {
      const data = getFirstDataPartFromMessage(message);
      if (data) {
        return data;
      }
    }
  }
  return null;
}
function getFirstDataPartFromMessage(message) {
  if (!isRecord2(message) || !Array.isArray(message.parts)) {
    return null;
  }
  for (const part of message.parts) {
    if (isRecord2(part) && part.kind === "data" && isRecord2(part.data)) {
      return part.data;
    }
  }
  return null;
}
function getArtifactText(event) {
  const rawEvent = event.rawEvent;
  if (!isRecord2(rawEvent) || rawEvent.kind !== "artifact-update" || !isRecord2(rawEvent.artifact)) {
    return null;
  }
  const parts = rawEvent.artifact.parts;
  if (!Array.isArray(parts)) {
    return null;
  }
  const text = parts.flatMap(
    (part) => isRecord2(part) && part.kind === "text" && typeof part.text === "string" ? [part.text] : []
  ).join("");
  return text.length > 0 ? text : null;
}
function renderSendTaskTool(data) {
  const input = isRecord2(data.input) ? data.input : {};
  return /* @__PURE__ */ jsxs16(Tool, { defaultOpen: true, children: [
    /* @__PURE__ */ jsx27(ToolHeader, { type: "tool-send_task", state: "input-available", title: "Calling subagent" }),
    /* @__PURE__ */ jsx27(ToolContent, { children: /* @__PURE__ */ jsx27(ToolInput, { input }) })
  ] });
}
function renderSendTaskResult(data) {
  const output = isRecord2(data.output) ? data.output : null;
  const taskId = output && typeof output.task_id === "string" ? output.task_id : null;
  return /* @__PURE__ */ jsxs16(Tool, { defaultOpen: true, children: [
    /* @__PURE__ */ jsx27(ToolHeader, { type: "tool-send_task", state: "output-available", title: "Subagent task created" }),
    /* @__PURE__ */ jsx27(ToolContent, { children: /* @__PURE__ */ jsx27(
      ToolOutput,
      {
        output: taskId ? /* @__PURE__ */ jsx27("div", { className: "p-2 font-mono text-[11px] text-foreground", children: taskId }) : data.output,
        errorText: void 0
      }
    ) })
  ] });
}
function renderCheckTaskStatusCall(data) {
  const input = isRecord2(data.input) ? data.input : {};
  return /* @__PURE__ */ jsxs16(Tool, { defaultOpen: true, children: [
    /* @__PURE__ */ jsx27(
      ToolHeader,
      {
        type: "tool-check_task_status",
        state: "input-available",
        title: "Checking subagent status"
      }
    ),
    /* @__PURE__ */ jsx27(ToolContent, { children: /* @__PURE__ */ jsx27(ToolInput, { input }) })
  ] });
}
function renderCheckTaskStatusResult(data) {
  const output = isRecord2(data.output) ? data.output : null;
  const status = output && isRecord2(output.status) && typeof output.status.state === "string" ? output.status.state : "unknown";
  const artifacts = output && Array.isArray(output.artifacts) ? output.artifacts : [];
  const artifactText = artifacts.flatMap((artifact) => {
    if (!isRecord2(artifact) || !Array.isArray(artifact.parts)) {
      return [];
    }
    return artifact.parts.flatMap(
      (part) => isRecord2(part) && part.kind === "text" && typeof part.text === "string" ? [part.text] : []
    );
  }).join("");
  return /* @__PURE__ */ jsxs16(Tool, { defaultOpen: true, children: [
    /* @__PURE__ */ jsx27(
      ToolHeader,
      {
        type: "tool-check_task_status",
        state: "output-available",
        title: `Subagent status: ${status}`
      }
    ),
    /* @__PURE__ */ jsx27(ToolContent, { children: /* @__PURE__ */ jsx27(
      ToolOutput,
      {
        output: artifactText.length > 0 ? /* @__PURE__ */ jsx27(MessageResponse, { className: "p-2 text-xs", children: artifactText }) : data.output,
        errorText: void 0
      }
    ) })
  ] });
}
function renderGenericToolData(data) {
  const isResult = data.type === "tool-result";
  const toolName = typeof data.toolName === "string" ? data.toolName : "unknown_tool";
  return /* @__PURE__ */ jsxs16(Tool, { defaultOpen: true, children: [
    /* @__PURE__ */ jsx27(
      ToolHeader,
      {
        type: `tool-${toolName}`,
        state: isResult ? "output-available" : "input-available"
      }
    ),
    /* @__PURE__ */ jsxs16(ToolContent, { children: [
      !isResult && data.input !== void 0 ? /* @__PURE__ */ jsx27(ToolInput, { input: data.input }) : null,
      isResult ? /* @__PURE__ */ jsx27(ToolOutput, { output: data.output ?? data, errorText: void 0 }) : null
    ] })
  ] });
}
var renderInspectorToolEvent = (event) => {
  const data = getStatusMessageData(event);
  if (!data || typeof data.type !== "string") {
    return null;
  }
  const toolName = typeof data.toolName === "string" ? data.toolName : "";
  if (data.type === "tool-call" && toolName === "send_task") {
    return renderSendTaskTool(data);
  }
  if (data.type === "tool-result" && toolName === "send_task") {
    return renderSendTaskResult(data);
  }
  if (data.type === "tool-call" && toolName === "check_task_status") {
    return renderCheckTaskStatusCall(data);
  }
  if (data.type === "tool-result" && toolName === "check_task_status") {
    return renderCheckTaskStatusResult(data);
  }
  if (data.type === "tool-call" || data.type === "tool-result") {
    return renderGenericToolData(data);
  }
  return null;
};
var renderInspectorArtifactEvent = (event) => {
  const text = getArtifactText(event);
  if (!text) {
    return null;
  }
  return /* @__PURE__ */ jsx27(CodeBlock, { code: text, language: "markdown", className: "text-[11px]" });
};
var inspectorEventRenderers = [
  renderInspectorToolEvent,
  renderInspectorArtifactEvent
];

// src/A2AChat.tsx
import { jsx as jsx28, jsxs as jsxs17 } from "react/jsx-runtime";
function getStatusClasses(state) {
  if (state === "connected") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700";
  }
  if (state === "connecting") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-700";
  }
  if (state === "error") {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }
  return "border-border bg-muted text-muted-foreground";
}
function getAgentButtonLabel(agentName, agentUrl) {
  if (agentName && agentName.trim().length > 0) {
    return agentName.trim();
  }
  return agentUrl;
}
function A2AChatCard({
  className,
  contentClassName,
  messagesClassName,
  title = "A2A Chat",
  description = "Reusable chat shell component",
  initialUrl,
  proxyBasePath,
  autoConnect,
  showConnectionForm = true,
  showHeader = true,
  showConnectionStatus = true,
  showRecentAgents,
  showTaskSessions = true,
  fillHeight = false,
  collapsibleSidebar = false,
  layout = "default",
  agentSuggestions = [],
  eventRenderers = inspectorEventRenderers,
  persistence
}) {
  const {
    url,
    setUrl,
    connectionState,
    connectionMessage,
    agentName,
    taskInput,
    setTaskInput,
    isSending,
    messages,
    recentAgents,
    taskSessions,
    activeTaskSessionId,
    handleConnect,
    handleSelectRecentAgent,
    handleSubmitTask,
    handleCreateTaskSession,
    handleSelectTaskSession,
    handleDeleteTaskSession
  } = useA2AChat({
    initialUrl,
    proxyBasePath,
    autoConnect,
    persistence
  });
  const isPanel = layout === "panel";
  const shouldShowRecentAgents = showRecentAgents ?? !isPanel;
  const fills = isPanel || fillHeight;
  const sidebarVisible = shouldShowRecentAgents || showTaskSessions;
  const canCollapse = collapsibleSidebar && !isPanel;
  const [sidebarCollapsed, setSidebarCollapsed] = React15.useState(false);
  const collapsed = canCollapse && sidebarCollapsed;
  return /* @__PURE__ */ jsxs17(Card, { className: cn("w-full max-w-5xl", fills && "flex h-full min-w-0 max-w-none flex-col overflow-hidden", className), children: [
    showHeader ? /* @__PURE__ */ jsxs17(CardHeader, { className: cn("border-b border-border", fills && "shrink-0", isPanel && "gap-2 p-3"), children: [
      /* @__PURE__ */ jsx28(CardTitle, { className: cn(isPanel && "text-base"), children: title }),
      description ? /* @__PURE__ */ jsx28(CardDescription, { children: description }) : null,
      showConnectionForm ? /* @__PURE__ */ jsxs17(
        "form",
        {
          className: "mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]",
          onSubmit: (event) => {
            event.preventDefault();
            handleConnect();
          },
          children: [
            /* @__PURE__ */ jsx28(
              Input,
              {
                value: url,
                onChange: (event) => setUrl(event.target.value),
                placeholder: "http://localhost:8000",
                "aria-label": "A2A server URL",
                list: agentSuggestions.length > 0 ? "a2a-agent-suggestions" : void 0
              }
            ),
            agentSuggestions.length > 0 ? /* @__PURE__ */ jsx28("datalist", { id: "a2a-agent-suggestions", children: agentSuggestions.map((suggestion) => /* @__PURE__ */ jsx28(
              "option",
              {
                value: suggestion.url,
                label: suggestion.description ? `${suggestion.label} - ${suggestion.description}` : suggestion.label
              },
              suggestion.url
            )) }) : null,
            /* @__PURE__ */ jsx28(
              Button,
              {
                type: "submit",
                variant: "outline",
                disabled: connectionState === "connecting",
                className: "h-9",
                children: connectionState === "connecting" ? "Connecting..." : "Connect"
              }
            )
          ]
        }
      ) : null,
      showConnectionStatus ? /* @__PURE__ */ jsxs17("div", { className: "mt-2 flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsx28(
          "div",
          {
            className: cn(
              "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
              getStatusClasses(connectionState)
            ),
            children: connectionMessage
          }
        ),
        agentName ? /* @__PURE__ */ jsxs17("div", { className: "text-xs text-muted-foreground", children: [
          "Agent: ",
          agentName
        ] }) : null
      ] }) : null
    ] }) : null,
    /* @__PURE__ */ jsx28(CardContent, { className: cn(fills && "min-h-0 flex-1", isPanel && "p-3", contentClassName), children: /* @__PURE__ */ jsxs17(
      "div",
      {
        className: cn(
          "grid min-w-0 gap-4",
          isPanel ? "h-full min-h-0 grid-rows-[auto_1fr]" : cn(
            fillHeight && "h-full min-h-0",
            !sidebarVisible ? "grid-cols-1" : collapsed ? "md:grid-cols-[auto_1fr]" : "md:grid-cols-[15rem_1fr]"
          )
        ),
        children: [
          sidebarVisible && collapsed ? /* @__PURE__ */ jsxs17("div", { className: "flex items-center justify-between gap-2 border-b border-border pb-2 md:flex-col md:items-stretch md:justify-start md:border-b-0 md:border-r md:pb-0 md:pr-2", children: [
            /* @__PURE__ */ jsx28(
              Button,
              {
                type: "button",
                variant: "ghost",
                size: "icon-sm",
                onClick: () => setSidebarCollapsed(false),
                "aria-label": "Expand sidebar",
                title: "Expand sidebar",
                children: /* @__PURE__ */ jsx28(PanelLeftOpenIcon, {})
              }
            ),
            showTaskSessions ? /* @__PURE__ */ jsx28(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "icon-sm",
                onClick: handleCreateTaskSession,
                disabled: connectionState !== "connected",
                "aria-label": "New task",
                title: "New task",
                children: /* @__PURE__ */ jsx28(PlusIcon2, {})
              }
            ) : null
          ] }) : null,
          sidebarVisible && !collapsed ? /* @__PURE__ */ jsxs17("aside", { className: cn("flex min-w-0 flex-col gap-4 border-b border-border pb-4", !isPanel && "md:border-r md:border-b-0 md:pb-0 md:pr-4"), children: [
            canCollapse ? /* @__PURE__ */ jsx28("div", { className: "flex items-center justify-end", children: /* @__PURE__ */ jsx28(
              Button,
              {
                type: "button",
                variant: "ghost",
                size: "icon-sm",
                onClick: () => setSidebarCollapsed(true),
                "aria-label": "Collapse sidebar",
                title: "Collapse sidebar",
                children: /* @__PURE__ */ jsx28(PanelLeftCloseIcon, {})
              }
            ) }) : null,
            shouldShowRecentAgents ? /* @__PURE__ */ jsxs17("div", { className: "flex flex-col gap-2", children: [
              /* @__PURE__ */ jsx28("div", { className: "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground", children: "Recent Agents" }),
              /* @__PURE__ */ jsx28("div", { className: "flex max-h-40 flex-col gap-1 overflow-y-auto", children: recentAgents.length > 0 ? recentAgents.map((agent) => /* @__PURE__ */ jsx28(
                Button,
                {
                  type: "button",
                  variant: agent.url === url ? "default" : "outline",
                  size: "sm",
                  onClick: () => handleSelectRecentAgent(agent.url),
                  className: "justify-start",
                  title: agent.url,
                  children: /* @__PURE__ */ jsx28("span", { className: "truncate", children: getAgentButtonLabel(agent.agentName, agent.url) })
                },
                agent.url
              )) : /* @__PURE__ */ jsx28("div", { className: "text-xs text-muted-foreground", children: "No recent agent connections yet." }) })
            ] }) : null,
            showTaskSessions ? /* @__PURE__ */ jsxs17("div", { className: "flex min-h-0 min-w-0 flex-1 flex-col gap-2", children: [
              /* @__PURE__ */ jsxs17(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  size: "sm",
                  onClick: handleCreateTaskSession,
                  disabled: connectionState !== "connected",
                  className: "w-full justify-start",
                  "aria-label": "New task",
                  title: "New task",
                  children: [
                    /* @__PURE__ */ jsx28(PlusIcon2, {}),
                    /* @__PURE__ */ jsx28("span", { children: "New Task" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx28("div", { className: "mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground", children: "Tasks" }),
              /* @__PURE__ */ jsx28("div", { className: "flex min-w-0 flex-1 flex-col gap-1 overflow-y-auto pb-1", children: taskSessions.map((session) => /* @__PURE__ */ jsxs17("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx28(
                  Button,
                  {
                    type: "button",
                    variant: session.id === activeTaskSessionId ? "default" : "outline",
                    size: "sm",
                    onClick: () => handleSelectTaskSession(session.id),
                    className: "min-w-0 flex-1 justify-start",
                    title: session.title,
                    children: /* @__PURE__ */ jsx28("span", { className: "truncate", children: session.title })
                  }
                ),
                /* @__PURE__ */ jsx28(
                  Button,
                  {
                    type: "button",
                    variant: "ghost",
                    size: "icon-sm",
                    onClick: () => handleDeleteTaskSession(session.id),
                    "aria-label": `Delete task ${session.title}`,
                    title: `Delete task ${session.title}`,
                    children: /* @__PURE__ */ jsx28(Trash2Icon, {})
                  }
                )
              ] }, session.id)) })
            ] }) : null
          ] }) : null,
          /* @__PURE__ */ jsxs17("div", { className: "flex min-h-0 min-w-0 flex-col gap-3", children: [
            /* @__PURE__ */ jsx28(MessageBox, { messages, eventRenderers, className: cn(fills && "min-h-0 flex-1", messagesClassName) }),
            /* @__PURE__ */ jsx28(
              InputBox,
              {
                value: taskInput,
                onChange: setTaskInput,
                onSubmit: handleSubmitTask,
                disabled: connectionState !== "connected" || isSending
              }
            )
          ] })
        ]
      }
    ) })
  ] });
}
function A2AChat(props) {
  const [queryClient] = React15.useState(() => new QueryClient());
  return /* @__PURE__ */ jsx28(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsx28(A2AChatCard, { ...props }) });
}
export {
  A2AChat,
  inspectorEventRenderers
};
