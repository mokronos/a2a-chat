import * as React from "react"

type UseControllableStateParams<T> = {
  /** The controlled value. When defined, the hook operates in controlled mode. */
  prop?: T | undefined
  /** The value used when uncontrolled. */
  defaultProp: T
  /** Called whenever the value changes, in both controlled and uncontrolled modes. */
  onChange?: (value: T) => void
}

type SetStateFn<T> = (prev: T) => T

/**
 * Controlled/uncontrolled state helper matching the ergonomics of the previous
 * `@radix-ui/react-use-controllable-state`, kept local so the components have no
 * dependency on Radix after the move to Base UI.
 */
function useControllableState<T>({
  prop,
  defaultProp,
  onChange = () => {},
}: UseControllableStateParams<T>): [T, (next: React.SetStateAction<T>) => void] {
  const [uncontrolledProp, setUncontrolledProp] = React.useState(defaultProp)
  const isControlled = prop !== undefined
  const value = isControlled ? prop : uncontrolledProp

  const onChangeRef = React.useRef(onChange)
  React.useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const setValue = React.useCallback(
    (next: React.SetStateAction<T>) => {
      if (isControlled) {
        const nextValue =
          typeof next === "function"
            ? (next as SetStateFn<T>)(prop as T)
            : next
        if (nextValue !== prop) {
          onChangeRef.current?.(nextValue)
        }
      } else {
        setUncontrolledProp((prev) => {
          const nextValue =
            typeof next === "function" ? (next as SetStateFn<T>)(prev) : next
          if (nextValue !== prev) {
            onChangeRef.current?.(nextValue)
          }
          return nextValue
        })
      }
    },
    [isControlled, prop]
  )

  return [value, setValue]
}

export { useControllableState }
