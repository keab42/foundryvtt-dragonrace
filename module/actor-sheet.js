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
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "features" }],
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

        html.find(".stat-roll-single").click(async (ev) => {
            const template = "systems/dragon-race/templates/chat/skill-roll-chat.hbs";
            const roller = $(ev.currentTarget);
            const input = roller.siblings(".stat-value").get(0);
            const roll = new Roll(roller.data("roll"), this.actor.getRollData()).evaluate({ async: false });  // avoid deprecation warning, backwards compatible
            const isSuccess = roll.total >= 4;
            const rollSuccess = isSuccess ? game.i18n.localize("DW.Success") : game.i18n.localize("DW.Failed");

            let templateData = {
                isSuccess: isSuccess,
                diceFormula: roll.formula,
                diceTotal: roll.total,
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

        });
        
        html.find(".add-item").click(this._addItem.bind(this));
        html.find(".item-edit").click(this._editItem.bind(this));
        html.find(".item-delete").click(this._deleteItem.bind(this));
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

    async _onAttributeRoll(event) {
        const roller = $(event.currentTarget);
        const roll = new Roll(roller.data("roll"), this.actor.getRollData()).evaluate({ async: false });  // avoid deprecation warning, backwards compatible
        const parent = roller.parent("div");
        const label = parent.find("label").get(0).innerText;
        const select = parent.find("select").get(0);
        const attributeName = select.name;
        const option = select.options[roll.total];

        roll.toMessage({
            user: game.user.id,  // avoid deprecation warning, backwards compatible
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: `<h2>${label} Roll</h2><h3>${option.innerText}</h3>`,
            roll: roll,
            sound: CONFIG.sounds.dice,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL
        });
    }

    async rendering(event) {
        const root = event.element[0];
        const alacrityStateElement = root.querySelector("#stat-alacrity .stat-value");
        const chutzpahStatElement = root.querySelector("#stat-chutzpah .stat-value");
        const ferociousnessStatElement = root.querySelector("#stat-ferociousness .stat-value");
        const scalinessStatElement = root.querySelector("#stat-scaliness .stat-value");
    }
}
