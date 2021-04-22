class VirtualTimeout
{
    private timeout: NodeJS.Timeout;
    private readonly callback: () => void
    private readonly timeStarted: number;
    private readonly countDown: number;
    private timePaused: number;
    private finished: boolean;

    constructor(callback: () => void, countDown: number) {
        this.timeout = setTimeout(() => {
            callback();
            this.finished = true;
        }, countDown);
        this.timeStarted = Date.now();
        this.callback = callback;
        this.timePaused = 0;
        this.countDown = countDown;
        this.finished = false;
    }

    clear() {
        clearTimeout(this.timeout);
        this.finished = true;
    }

    pause() {
        if(!this.finished) {
            clearTimeout(this.timeout);
            this.timePaused = Date.now() - this.timeStarted;
        }
    }

    resume() {
        if(!this.finished) {
            this.timeout = setTimeout(() => {
                this.callback();
                this.finished = true;
            }, this.countDown - this.timePaused);
        }
    }

    isFinished() {
        return this.finished;
    }

    getNativeTimeout() {
        return this.timeout;
    }
}

export default VirtualTimeout;