import { DragonRaceActor } from "./actor.js";
import { DragonRaceActorSheet } from "./actor-sheet.js";
import { DragonRaceItemSheet } from "./item-sheet.js";

Hooks.once("init", async function () {
    console.log(`DragonRace: Initializing`);

    // Define custom Entity classes
    if (isNewerVersion(game.data.version, "0.8.0")) {
        CONFIG.Actor.documentClass = DragonRaceActor;
    } else {
        CONFIG.Actor.entityClass = DragonRaceActor;
    }

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("DragonRace", DragonRaceActorSheet, { label: "Dragon Race Character Sheet (Default)", makeDefault: true });

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("DragonRace", DragonRaceItemSheet, { label: "Dragon Race Item Sheet (Default)", makeDefault: true });

    Handlebars.registerHelper("removeProperty", function (obj, property) {
        delete obj[property];
        return obj;
    });

    // CONFIG.debug.hooks = true;
});

Hooks.once("ready", async function () {
    // Make sure all roll tables are always present.
    const existingRollTables = [];
    const rollTablesToAdd = [];
    const rollTables = {
        //Equipment: "/systems/dragon-race/resources/roll-tables/fvtt-RollTable-equipment.json"
    };

    if (isNewerVersion(game.data.version, "0.8.0")) {
        for (const document of game.collections.get("RollTable").contents) {
            existingRollTables.push(document.name);
        }
    } else {
        for (const document of RollTable.collection.entities) {
            existingRollTables.push(document.name);
        }
    }

    for (let [key, value] of Object.entries(rollTables)) {
        if (existingRollTables.indexOf(key) === -1) {
            const rollTable = await $.getJSON(value).then();
            rollTablesToAdd.push(rollTable);
        }
    }

    RollTable.create(rollTablesToAdd);
});

Hooks.on("renderDragonRaceActorSheet", (ev) => {
   ev.rendering(ev);
});

Hooks.on("renderChatLog", (app, html, data) => Chat.addChatListeners(html));