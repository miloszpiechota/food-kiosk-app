export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
}

export const defaultAccessibilitySettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
};
