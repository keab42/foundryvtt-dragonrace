/**
 * Extend the basic ActorSheet
 * @extends {ActorSheet}
 */

 const itemItemType = "MiscItem";
 const propItemType = "Prop";
 const spellItemType = "Spell";

export class DefinitelyWizardsActorSheet extends ActorSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["definitelywizards", "sheet", "actor"],
            template: "systems/definitely-wizards/templates/actor-sheet.html",
            width: 750,
            height: 625,
            scrollY: [ "dw-item-list", "dw-spell-list", "dw-prop-list" ],
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

        html.find(".attribute-select").change(this._onAttributeChanged.bind(this));

        html.find(".prop-select").change(this._onPropChanged.bind(this));

        html.find(".attribute-roll").click(this._onAttributeRoll.bind(this));

        html.find(".stat-button-plus").click((ev) => {
            const isWizardRoll = this._isWizardRoll(ev.currentTarget);
            this.actor.updateStat(isWizardRoll, 1);
        });

        html.find(".stat-button-minus").click((ev) => {
            const isWizardRoll = this._isWizardRoll(ev.currentTarget);
            this.actor.updateStat(isWizardRoll, -1);
        });

        html.find(".stat-button-reset").click((ev) => {
            const isWizardRoll = this._isWizardRoll(ev.currentTarget);
            this.actor.resetStat(isWizardRoll);
        });

        html.find(".stat-roll-single, .stat-roll-double").click(async (ev) => {
            const template = "systems/definitely-wizards/templates/chat/skill-roll-chat.hbs";
            const isWizardRoll = this._isWizardRoll(ev.currentTarget);
            const roller = $(ev.currentTarget);
            const input = roller.siblings(".stat-value").get(0);
            const currentValue = parseInt(input.value);
            const roll = new Roll(roller.data("roll"), this.actor.getRollData()).evaluate({ async: false });  // avoid deprecation warning, backwards compatible
            const isSuccess = roll.total <= currentValue;
            const rollSuccess = isSuccess ? game.i18n.localize("DW.Success") : game.i18n.localize("DW.Failed");

            let templateData = {
                isWizardRoll: isWizardRoll,
                isSuccess: isSuccess,
                diceFormula: roll.formula,
                diceTotal: roll.total,
                owner: this.actor.id
            };

            if (isSuccess && isWizardRoll) {
                this.actor.updateStat(isWizardRoll, 1);
            }

            ChatMessage.create({
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({actor: this.actor}),
                content: await renderTemplate(template, templateData),
                roll: roll,
                sound: CONFIG.sounds.dice,
                type: CONST.CHAT_MESSAGE_TYPES.ROLL
             });

        });

        html.find(".add-item, .add-prop, .add-spell").click(this._addItem.bind(this));

        html.find(".item-edit, .prop-edit, .spell-edit").click(this._editItem.bind(this));

        html.find(".item-delete, .prop-delete, .spell-delete").click(this._deleteItem.bind(this));

        html.find(".item-roll, .prop-roll, .spell-roll").click(this._rollItem.bind(this));
    }

    _prepareCharacterItems(sheetData) {
        const actorData = sheetData.actor;

        const miscItems = [];
        const props = [];
        const spells = [];

        for (let i of sheetData.items) {
            let item = i.datal
            i.img = i.img || DEFAULT_TOKEN;

            if (i.type === itemItemType){
                miscItems.push(i);
            } else if (i.type === propItemType) {
                props.push(i);
            } else if (i.type === spellItemType) {
                spells.push(i);
            }
        }

        actorData.miscItems = miscItems;
        actorData.props = props;
        actorData.spells = spells;
    }

    async _addItem(event) {
        let classes = event.target.classList;
        var itemType = "";

        if (classes.contains("add-item")) {
            itemType = itemItemType;
        } else if (classes.contains("add-prop")) {
            itemType = propItemType;
        } else if (classes.contains("add-spell")) {
            itemType = spellItemType;
        }

        if (itemType.length > 0) {
            let item = await this.actor.createEmbeddedDocuments("Item", [{type: itemType, name: game.i18n.localize('DW.NewItemName')}]);
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

    async _rollItem(event) {
        const itemID = $(event.currentTarget).parents("[data-item-id]")[0].dataset.itemId;
        const item = this.actor.items.get(itemID);
        const messageData = {
            speaker: ChatMessage.getSpeaker({actor: this.actor}),
            content: `
                <div class="definitelywizards">
                    <div class="chatItem flexrow">
                        <div class="item-image" tabindex="0" aria-label="${item.name}" style="background-image: url('${item.img}')"></div>
                        <h4>${item.name}</h4>
                    </div>
                </div>
                <div>${item.getRollData().description}</div>`
        }

        await ChatMessage.create(messageData);
    }

    _isWizardRoll(element) {
        return element.parentElement.id === "stat-wizard";
    }

    async _onPropChanged(event) {
        // TODO: - Decide if you want to auto add props or not
    }

    async _onAttributeRoll(event) {
        const roller = $(event.currentTarget);
        const roll = new Roll(roller.data("roll"), this.actor.getRollData()).evaluate({ async: false });  // avoid deprecation warning, backwards compatible
        const parent = roller.parent("div");
        const label = parent.find("label").get(0).innerText;
        const select = parent.find("select").get(0);
        const attributeName = select.name;
        const option = select.options[roll.total - 1];

        await this.actor.update({ [attributeName]: option.value });

        if(attributeName === "data.player-class" && roll.total === 12) {
            $(".customClass").show();
        }

        await this.updateClass(option.value);

        roll.toMessage({
            user: game.user.id,  // avoid deprecation warning, backwards compatible
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: `<h2>${label} Roll</h2><h3>${option.innerText}</h3>`,
            roll: roll,
            sound: CONFIG.sounds.dice,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL
        });
    }

   async  _onAttributeChanged(event) {
        const select = event.target;

        if(event.currentTarget.name === "system.player-class") {
            this._onClassChanged(event);
        }
    }

    async _onClassChanged(event) {
        await this.updateClass(event.target.value);
    }

    async updateClass(className) {
        let classDesc = this.actor.system.playerClasses[className].description;

        this.actor.update({ "system.class-description": game.i18n.localize(classDesc)});
    }

    async rendering(event) {
        const root = event.element[0];
        const wizardStatElement = root.querySelector("#stat-wizard .stat-value");
        const wildStatElement = root.querySelector("#stat-wild .stat-value");
        const classElement = root.querySelector(".attribute select[name='system.player-class']");
        const prop1Element = root.querySelector(".attribute select[name='system.prop-1']");
        const prop2Element = root.querySelector(".attribute select[name='system.prop-2']");
        let wizardVal = parseInt(wizardStatElement.value, 10);
        let wildVal = parseInt(wildStatElement.value, 10);
        let classValue = classElement.value;
        let prop1Value = prop1Element.value;
        let prop2Value = prop2Element.value;

        if(classValue === "custom") {
            $(root.querySelector(".customClass")).show();
        } else {
            $(root.querySelector(".customClass")).hide();
        }

        if(classValue === "none") {
            $(root.querySelector("#class-description-panel")).hide();
        } else {
            $(root.querySelector("#class-description-panel")).show();
        }

        if (prop1Value === "custom") {
            $(root.querySelector(".customProp1")).show();
        } else {
            $(root.querySelector(".customProp1")).hide();
        }

        if (prop2Value === "custom") {
            $(root.querySelector(".customProp2")).show();
        } else {
            $(root.querySelector(".customProp2")).hide();
        }

        // Color a stat red if it's value is six.
        if (wizardVal >= 6) {
            wizardStatElement.classList.add("error-red");
        }

        if (wildVal >= 6) {
            wildStatElement.classList.add("error-red");
        }
    }
}
