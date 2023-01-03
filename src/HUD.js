export class HUD {
    constructor() {
        this.stamina_inner = document.getElementById("stamina-inner");
    }

    staminaPercentage(percent) {
        this.stamina_inner.style.width = percent + "%";
    }
}