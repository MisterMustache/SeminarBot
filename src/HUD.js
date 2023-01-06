import { validateCode } from "./main.js";

export class HUD {
    constructor() {
        this.codePopup = document.getElementById("codePopup");
        this.inputCode = document.querySelector("#inputCode");
        this.stamina = document.getElementById("stamina");
        this.slot1 = document.getElementById("slot1");
        this.slot2 = document.getElementById("slot2");
        this.slot3 = document.getElementById("slot3");
        this.slot4 = document.getElementById("slot4");

        this.inputCode.form.addEventListener("submit", function(event) {
            const inputCode = document.querySelector("#inputCode");

            if (inputCode.value === "") {
                inputCode.classList.add("error");
            }
            else {
                validateCode();
            }
            event.preventDefault();
        });
    }

    codeInputPopup() {
        this.codePopup.style.display = "block";
        this.inputCode.classList.remove("error");
        this.inputCode.value = "";
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