/**
 * Extend the basic ActorSheet
 * @extends {ActorSheet}
 */

 const itemequipmentType = "MiscItem";

export class DragonRaceActorSheet extends ActorSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["dragonrace", "sheet", "actor"],
            template: "systems/dragon-race/templates/actor-sheet.html",
            width: 750,
            height: 625,
            scrollY: [ "dr-item-list" ],
            dragDrop: [{ dropSelector: null, dragSelector: '[draggable]' }],
            resizable: false
        });
    }

    /** @override */
    getData(options) {
        let baseData = super.getData(options);
        let sheetData = {};
        sheetData = baseData.data;  // needed to handle the new 0.8.x data depth
        sheetData.actor = this.actor.toObject(false);  // needed for actor.x handlebars
        sheetData.editable = this.options.editable;  // needed to fix TinyMCE due to missing editable parameter

        this._prepareCharacterItems(sheetData);

        return sheetData;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        html.find(".stat-roll-single").click(this._rollStat.bind(this));

        html.find(".add-item").click(this._addItem.bind(this));
        html.find(".item-edit").click(this._editItem.bind(this));
        html.find(".item-delete").click(this._deleteItem.bind(this));

        console.log(this.actor.isOwner);
        // Drag events for macros.
        if (this.actor.isOwner) {
            console.log("MKTEST");
            let handler = ev => this._onDragStart(ev);
            // Find all items on the character sheet.
            html.find('img.stat-roll-single').each((i, img) => {
                console.log(i);
                console.log(img);
                // Add draggable attribute and dragstart listener.
                img.setAttribute("draggable", true);
                img.addEventListener("dragstart", handler, false);
          });
        } else {
            console.log("MKTEST");
            console.log("Not Owner");
        }
    }

    async _rollStat(event) {
        const template = "systems/dragon-race/templates/chat/stat-roll-chat.hbs";
        const localisedStatName = this._getLocalisedStatName(event.currentTarget);
        const roller = $(event.currentTarget);
        const roll = new Roll(roller.data("roll"), this.actor.getRollData()).evaluate({ async: false });  // avoid deprecation warning, backwards compatible

        let results = [];
        let successes = 0;
        let failures = 0;

        for (let dicetype of roll.dice) {
            let isSuccess = false;
            for (let result of dicetype.results) {
                if (this._isSuccess(result.result)) {
                    successes++;
                    isSuccess = true;
                } else {
                    failures++;
                    isSuccess = false;
                }
                let outcome = {
                    result: result.result,
                    success: isSuccess
                };
                results.push(outcome);
            }
        }

        console.log(results);

        let templateData = {
            successes: successes,
            failures: failures,
            results: results,
            diceFormula: roll.formula,
            diceTotal: roll.total,
            statName: localisedStatName,
            owner: this.actor.id
        };

        ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({actor: this.actor}),
            content: await renderTemplate(template, templateData),
            roll: roll,
            sound: CONFIG.sounds.dice,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL
         });
    }

    _getLocalisedStatName(element) {
        let statName = "";
        switch(element.parentElement.id) {
            case "stat-alacrity":
                statName =  game.i18n.localize("DR.Alacrity");
                break;
            case "stat-chutzpah":
                statName =  game.i18n.localize("DR.Chutzpah");
                break;
            case "stat-ferociousness":
                statName =  game.i18n.localize("DR.Ferociousness");
                break;
            case "stat-scaliness":
                statName =  game.i18n.localize("DR.Scaliness");
                break;
        }
        console.log("MKTEST");
        console.log(statName);

        return statName
    }

    _isSuccess(number) {
        return number >= 4;
    }

    _prepareCharacterItems(sheetData) {
        const actorData = sheetData.actor;

        const miscItems = [];

        for (let i of sheetData.items) {
            let item = i.datal
            i.img = i.img || DEFAULT_TOKEN;

            if (i.type === itemequipmentType){
                miscItems.push(i);
            }
        }

        actorData.miscItems = miscItems;
    }

    async _addItem(event) {
        let classes = event.target.classList;
        var equipmentType = itemequipmentType;

        if (equipmentType.length > 0) {
            let item = await this.actor.createEmbeddedDocuments("Item", [{type: equipmentType, name: game.i18n.localize('DW.NewItemName')}]);
            await item[0].sheet.render(true);
        }
    }

    async _editItem(event) {
        const itemID = $(event.currentTarget).parents("[data-item-id]")[0].dataset.itemId;
        const item = this.actor.items.get(itemID);
        if (item) { item.sheet.render(true); }
    }

    async _deleteItem(event) {
        const itemID = $(event.currentTarget).parents("[data-item-id]")[0].dataset.itemId;
        const item = this.actor.items.get(itemID);

        new Dialog({
            title: `${game.i18n.localize("DW.ConfirmItemDelete")}: ${item.name}`,
            content: game.i18n.localize("DW.ConfirmItemDeleteText"),
            buttons: {
                yes: {
                    icon: "<i class='fas fa-check'></i>",
                    label: game.i18n.localize("Yes"),
                    callback: async (html) => {
                        await item.delete();
                    }
                },
                no: {
                    icon: "<i class='fas fa-times'></i>",
                    label: game.i18n.localize("No")
                }
            },
            default: "no"
        }).render(true);
    }

    async rendering(event) {
        const root = event.element[0];
        const alacrityStateElement = root.querySelector("#stat-alacrity .stat-value");
        const chutzpahStatElement = root.querySelector("#stat-chutzpah .stat-value");
        const ferociousnessStatElement = root.querySelector("#stat-ferociousness .stat-value");
        const scalinessStatElement = root.querySelector("#stat-scaliness .stat-value");
    }
}
