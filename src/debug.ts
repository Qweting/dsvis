export class Debug {
    private enabled: boolean;

    constructor() {
        const searchParams = new URLSearchParams(window.location.href);
        const debugParam = searchParams.get("debug");

        this.enabled = Boolean(debugParam);
    }

    log(message?: unknown, ...optionalParams: unknown[]): void {
        if (this.enabled) {
            console.log(message, ...optionalParams);
        }
    }

    isEnabled(): boolean {
        return this.enabled;
    }
}
