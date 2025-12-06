//@ts-check
import { beforeEvents } from "@minecraft/server-admin";
import { system, CustomCommandOrigin, CustomCommandStatus, CustomCommandParamType, world, CommandPermissionLevel } from "@minecraft/server";
import { Commands } from "./Commands";
import config from "./config.js";

system.beforeEvents.startup.subscribe((ev) => {
    if(config.permission === CommandPermissionLevel.Any) console.warn("§cCommandPermissionLevel.Anyにすると全員が実行できてしまいます。よろしいですか？");

    /**
     * @param {string} name 
     * @param {string} description 
     * @param {import("@minecraft/server").CustomCommandParameter[]} mandatoryParameters 
     * @param {import("@minecraft/server").CustomCommandParameter[]} optionalParameters 
     * @param {(origin: CustomCommandOrigin, ...args: any[]) => { status: CustomCommandStatus, message?: string } | undefined} callback 
     */
    const registerCommand = function(name, description, mandatoryParameters, optionalParameters, callback) {
        ev.customCommandRegistry.registerCommand(
            {
                name,
                description,
                mandatoryParameters,
                optionalParameters,
                permissionLevel: config.permission,
            },
            callback
        ); 
    };

    registerCommand(
        "easyban:ban",
        "プレイヤーをBANし、BanListに入れます",
        [
            {
                name: "target",
                type: CustomCommandParamType.String,
            }
            
        ],
        [
            {
                name: "reason",
                type: CustomCommandParamType.String,
            }
        ],
        Commands.ban
    )

    registerCommand(
        "easyban:unban",
        "プレイヤーのBANを解除し、BanListから外します",
        [
            {
                name: "target",
                type: CustomCommandParamType.String,
            }
            
        ],
        [],
        Commands.unban
    )

    registerCommand(
        "easyban:banlist",
        "BanListを表示します",
        [],
        [],
        Commands.banlist
    )
});

world.afterEvents.worldLoad.subscribe(() => {
    const dynamicPlayerList = world.getDynamicProperty("playerList");
    const dynamicBanList = world.getDynamicProperty("banList");

    if(!dynamicPlayerList) world.setDynamicProperty("playerList", JSON.stringify([]));
    if(!dynamicBanList) world.setDynamicProperty("banList", JSON.stringify([]));

    beforeEvents.asyncPlayerJoin.subscribe(async (ev)=>{
        const { name, persistentId } = ev;
        const dynamicPlayerList = world.getDynamicProperty("playerList");
        const dynamicBanList = world.getDynamicProperty("banList");

        const playerList = typeof dynamicPlayerList === "string" && JSON.parse(dynamicPlayerList);

        // プレイヤーが存在しない場合に追加
        if (!playerList.some(playerInfo => playerInfo.persistentId === persistentId)) {
            const info = {
                name: name,
                persistentId: persistentId,
            };

            playerList.push(info);
            world.setDynamicProperty("playerList", JSON.stringify(playerList));
        }
        
        const banList = typeof dynamicBanList === "string" && JSON.parse(dynamicBanList);

        let banListUpdated = false;
        for(let banInfo of banList){
            if(banInfo.name === name && banInfo.persistentId === undefined){
                banInfo.persistentId = persistentId;
                banListUpdated = true;
                break;
            }
        }
        
        if(banListUpdated){
            world.setDynamicProperty("banList", JSON.stringify(banList));
        }

        for(const banInfo of banList){
            if(banInfo.persistentId === persistentId){
                ev.disconnect(`あなたはこのサーバーからBANされました-> 理由: ${banInfo.reason}`);
            }
        }
    });
})