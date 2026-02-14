interface TurnstileInstance {
  render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
  execute: (widgetId: string, options?: Record<string, unknown>) => void;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

interface Window {
  turnstile: TurnstileInstance;
}
