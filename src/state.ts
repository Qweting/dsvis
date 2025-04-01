export class State {
    private resetting: boolean;
    private animating: boolean;

    constructor() {
        this.resetting = false;
        this.animating = false;
    }

    isResetting(): boolean {
        return this.resetting;
    }

    setAnimating(val: boolean): void {
        this.animating = val;
    }

    isAnimating(): boolean {
        return this.animating;
    }

    async runWhileResetting(func: () => Promise<void> | void): Promise<void> {
        this.resetting = true;
        await func();
        this.resetting = false;
    }
}
