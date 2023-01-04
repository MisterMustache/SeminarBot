export class AudioPlayer {
    constructor(file) {
        this.audio = new Audio(file);
    }

    play() {
        this.audio.play().then(_ => {});
    }

    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
    }

    volume(percent) {
        this.audio.volume = percent / 100;
    }
}
