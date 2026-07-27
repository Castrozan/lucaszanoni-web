interface StatusBarWindowIdentity {
  readonly id: string;
  readonly label: string;
  readonly isActive: boolean;
}

export interface StatusBarLinkWindowModel extends StatusBarWindowIdentity {
  readonly kind: "link";
  readonly href: string;
}

export interface StatusBarActionWindowModel extends StatusBarWindowIdentity {
  readonly kind: "action";
  readonly onSelect: () => void;
}

export type StatusBarWindowModel =
  | StatusBarLinkWindowModel
  | StatusBarActionWindowModel;

export interface StatusBarModel {
  readonly sessionLabel: string;
  readonly windows: readonly StatusBarWindowModel[];
}
