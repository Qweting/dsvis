export class Debugger {
    private enabled: boolean;

    constructor() {
        // Get debug parameter from the URL query
        const searchParams = new URLSearchParams(window.location.href);
        const debugParam = searchParams.get("debug");

        // Boolean conversion not prefect because only null or "" will return false aka any non empty string returns true
        this.enabled = Boolean(debugParam);
    }

    log(message?: unknown, ...optionalParams: unknown[]): void {
        // Log out only if enabled
        if (this.enabled) {
            console.log(message, ...optionalParams);
        }
    }

    isEnabled(): boolean {
        return this.enabled;
    }
}
