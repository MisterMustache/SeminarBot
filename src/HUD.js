export class HUD {
    constructor() {
        this.stamina = document.getElementById("stamina");
        this.slot1 = document.getElementById("slot1");
        this.slot2 = document.getElementById("slot2");
        this.slot3 = document.getElementById("slot3");
        this.slot4 = document.getElementById("slot4");
    }

    staminaPercentage(percent) {
        this.stamina.style.width = percent + "%";
    }

    slot1Value(value) {
        this.slot1.innerText = value;
    }

    slot2Value(value) {
        this.slot2.innerText = value;
    }

    slot3Value(value) {
        this.slot3.innerText = value;
    }

    slot4Value(value) {
        this.slot4.innerText = value;
    }
}