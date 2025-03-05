export class State {
    private resetting: boolean;
    private animating: boolean;
    private runnerButton: HTMLButtonElement;

    constructor(runnerButton: HTMLButtonElement) {
        this.resetting = false;
        this.animating = false;
        this.runnerButton = runnerButton;
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

    isRunning(): boolean {
        return this.runnerButton.classList.contains("selected");
    }

    setRunning(running: boolean): this {
        const classes = this.runnerButton.classList;
        if (running) {
            classes.add("selected");
        } else {
            classes.remove("selected");
        }
        return this;
    }

    toggleRunner(): this {
        return this.setRunning(!this.isRunning());
    }
}
