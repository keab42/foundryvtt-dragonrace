import * as Dice from "./dice.js"

export function addChatListeners(html) {
    html.on('click', 'button.rollConsequences', rollConsequences);
}

function rollConsequences(event) {
    const card = event.currentTarget.closest(".skill-roll");
    const actorID = card.dataset.ownerId;
    const isWizardRoll = card.dataset.iswizardroll === "true";

    Dice.rollConsequences(actorID, isWizardRoll);

}