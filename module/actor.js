/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the HoneyHeist system.
 * @extends {Actor}
 */

export class DefinitelyWizardsActor extends Actor {
    /** @override */
    // getRollData() {
    //  const data = super.getRollData();
    //  return data;
    // }
    // /** @override */
    // prepareData() {
    //  super.prepareData();
    //  const actorData = this.data;
    // }


    async updateStat(isWizard, offset) {
        console.log("MKTEST - Update Stat")
        console.log(isWizard);

        let wizardStat = this.system.stats.wizard;
        let wildStat = this.system.stats.wild;
        let oldValue = 0;
        let newValue = 0;

        // These stat values should always be numbers, but sometimes
        // they get returned as strings and I don't know why.
        if (typeof wizardStat === "string") {
            wizardStat = parseInt(wizardStat);
        }

        if (typeof wildStat === "string") {
            wildStat = parseInt(wildStat);
        }

        if (isWizard) {
            oldValue = wizardStat;
            wizardStat += offset;
            newValue = wizardStat;
        } else {
            oldValue = wildStat;
            wildStat += offset;
            newValue = wildStat;
        }

        if (wildStat >= 0 && wildStat <= 7) {
            // Set the new values in the sheet.
            await this.update({ "system.stats.wizard": wizardStat });
            await this.update({ "system.stats.wild": wildStat });

            await this._postUpdateToChat(isWizard, oldValue, newValue);

            // Check to see if either the bear or criminal stat has reached 6,
            // which means it's the end for this bear.
            if (wildStat >= 7) {
                ChatMessage.create({
                    user: game.user.id,  // avoid deprecation warning, backwards compatible
                    speaker: ChatMessage.getSpeaker({ actor: this }),
                    content: game.i18n.localize("DW.EndGame")
                });
            }
        }
    }

    async resetStat(isWizard) {
        let wizardStat = this.system.stats.wizard;
        let wildStat = this.system.stats.wild;
        let oldValue = 0;
        let newValue = 0;

        if (typeof wizardStat === "string") {
            wizardStat = parseInt(wizardStat);
        }

        if (typeof wildStat === "string") {
            wildStat = parseInt(wildStat);
        }

        if (isWizard) {
            oldValue = wizardStat;
            wizardStat = 2;
            newValue = wizardStat;
        } else {
            oldValue = wildStat;
            wildStat = 2;
            newValue = wildStat;
        }

        await this.update({ "system.stats.wizard": wizardStat });
        await this.update({ "system.stats.wild": wildStat });

        await this._postUpdateToChat(isWizard, oldValue, newValue);
    }

    async _postUpdateToChat(isWizard, oldValue, newValue) {
        const template = "systems/definitely-wizards/templates/chat/actor-stat-update-chat.hbs";

        console.log(oldValue);
        console.log(newValue);

        let templateData = {
            isWizardRoll: isWizard,
            oldValue: oldValue,
            newValue: newValue,
            owner: this.id
        };

        ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({actor: this}),
            content: await renderTemplate(template, templateData),
            type: CONST.CHAT_MESSAGE_TYPES.OOC
        });
    }
}
