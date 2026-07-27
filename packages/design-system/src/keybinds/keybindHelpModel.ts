import type { KeybindBindingView } from "./keybindViews";

export function countBindingCollisions(
  bindings: readonly KeybindBindingView[],
): Map<string, number> {
  const collisionsByBinding = new Map<string, number>();
  for (const binding of bindings) {
    collisionsByBinding.set(
      binding.currentBinding,
      (collisionsByBinding.get(binding.currentBinding) ?? 0) + 1,
    );
  }
  return collisionsByBinding;
}

export function filterAndSortBindings(
  bindings: readonly KeybindBindingView[],
  query: string,
): KeybindBindingView[] {
  const normalizedQuery = query.trim().toLowerCase();
  const matching =
    normalizedQuery.length === 0
      ? [...bindings]
      : bindings.filter((binding) =>
          `${binding.label} ${binding.currentBinding}`
            .toLowerCase()
            .includes(normalizedQuery),
        );
  return matching.sort((first, second) =>
    first.label.localeCompare(second.label),
  );
}
