import { DefinitelyWizardsActor } from "./actor.js";
import { DefinitelyWizardsActorSheet } from "./actor-sheet.js";
import { DefinitelyWizardsItemSheet } from "./item-sheet.js";
import * as Chat from "./chat.js"

Hooks.once("init", async function () {
    console.log(`DefinitelyWizards: Initializing`);

    // Define custom Entity classes
    if (isNewerVersion(game.data.version, "0.8.0")) {
        CONFIG.Actor.documentClass = DefinitelyWizardsActor;
    } else {
        CONFIG.Actor.entityClass = DefinitelyWizardsActor;
    }

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("definitelywizards", DefinitelyWizardsActorSheet, { label: "Definitely Wizards Character Sheet (Default)", makeDefault: true });

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("definitelywizards", DefinitelyWizardsItemSheet, { label: "Definitely Wizards Item Sheet (Default)", makeDefault: true });

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
        Judge: "/systems/definitely-wizards/resources/roll-tables/fvtt-RollTable-judge.json",
        RoomType: "/systems/definitely-wizards/resources/roll-tables/fvtt-RollTable-room-type.json",
        MainObstacle: "/systems/definitely-wizards/resources/roll-tables/fvtt-RollTable-main-obstacle.json",
        AddedChallenge: "/systems/definitely-wizards/resources/roll-tables/fvtt-RollTable-added-challenge.json",
        Surprise: "/systems/definitely-wizards/resources/roll-tables/fvtt-RollTable-surprise.json",
        FinalTest: "/systems/definitely-wizards/resources/roll-tables/fvtt-RollTable-final-test.json"
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
        console.log("MKTEST: key:" + key + " value: " + value);
        if (existingRollTables.indexOf(key) === -1) {
            const rollTable = await $.getJSON(value).then();
            rollTablesToAdd.push(rollTable);
        }
    }

    RollTable.create(rollTablesToAdd);
});

Hooks.on("renderDefinitelyWizardsActorSheet", (ev) => {
   ev.rendering(ev);
});


Hooks.on("renderChatLog", (app, html, data) => Chat.addChatListeners(html));