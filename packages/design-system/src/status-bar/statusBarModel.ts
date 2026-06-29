export interface StatusBarWindowModel {
  readonly id: string;
  readonly label: string;
  readonly isActive: boolean;
  readonly onSelect: () => void;
}

export interface StatusBarModel {
  readonly sessionLabel: string;
  readonly windows: readonly StatusBarWindowModel[];
}
