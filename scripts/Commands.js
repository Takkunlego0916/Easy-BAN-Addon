//@ts-check

import { CustomCommandOrigin, CustomCommandSource, CustomCommandStatus, Player, system, world } from "@minecraft/server";
import { getJSTTimestamp } from "./utils.js";
/**
 * @typedef {Object} PlayerInfo
 * @property {string} name
 * @property {string} persistentId
 */

export class Commands {
    /**
     * @param {CustomCommandOrigin} origin 
     * @param {string} target 
     * @param {String} reason 
     * @returns {{ status: CustomCommandStatus, message?: string } | undefined}
     */
    static ban(origin, target, reason = "このサーバーの管理者によりBANされました") {
        const dynamicPlayerList = world.getDynamicProperty("playerList");
        const dynamicBanList = world.getDynamicProperty("banList");

        if(typeof dynamicPlayerList !== "string") return;
        if(typeof dynamicBanList !== "string") return;

        const playerList = JSON.parse(dynamicPlayerList);
        const banList = JSON.parse(dynamicBanList);

        const isAlreadyBanned = banList.some(banInfo => banInfo.name === target);
    
        if(isAlreadyBanned) {
            return {
                status: CustomCommandStatus.Failure,
                message: `指定されたIDのプレイヤーは既にBANされています`
            };
        }

        /** @type {PlayerInfo | undefined} */
        const targetPlayer = playerList.find(playerInfo => playerInfo.name === target);

        let source;

        switch(origin.sourceType) {
            case CustomCommandSource.Server:
                source = "Server";
                break;

            case CustomCommandSource.Entity:
                if(origin.sourceEntity instanceof Player) {
                    source = origin.sourceEntity.name;
                }
                break;

            default:
                source = "Unknown";
        }

        const banInfo = {
            persistentId: targetPlayer?.persistentId || undefined,
            name: targetPlayer?.name || target,
            created: getJSTTimestamp(),
            source: source,
            reason: reason,
        }

        banList.push(banInfo);

        system.run(()=>{
            world.getDimension("overworld").runCommand(`/kick ${target} ${reason}`);
        });
        
        world.setDynamicProperty("banList", JSON.stringify(banList));

        return {
            status: CustomCommandStatus.Success,
            message: `プレイヤーをBANしました \nプレイヤー: ${target}理由: ${reason}`
        }
    }

    /**
     * 
     * @param {CustomCommandOrigin} origin 
     * @param {string} target 
     * @returns {{ status: CustomCommandStatus, message?: string } | undefined}
     */
    static unban(origin, target){
        const dynamicPlayerList = world.getDynamicProperty("playerList");
        const dynamicBanList = world.getDynamicProperty("banList");

        if(typeof dynamicPlayerList !== "string") return;
        if(typeof dynamicBanList !== "string") return;

        let banList = JSON.parse(dynamicBanList);
        const isAlreadyBanned = banList.some(banInfo => banInfo.name === target);

        if(!isAlreadyBanned) {
            return {
                status: CustomCommandStatus.Failure,
                message: `指定されたIDのプレイヤーはBANされていません`
            };
        }

        banList = banList.filter(banInfo => banInfo.name !== target);
        world.setDynamicProperty("banList", JSON.stringify(banList));
        
        return {
            status: CustomCommandStatus.Success,
            message: `BANを解除しました \nプレイヤー: ${target}`
        }
    }

    static banlist(origin){
        const dynamicBanList = world.getDynamicProperty("banList");
        if(typeof dynamicBanList !== "string") return;

        let banList = JSON.parse(dynamicBanList);

        if(banList.length === 0) {
            return {
                status: CustomCommandStatus.Success,
                message: "プレイヤーは誰もBANされていません"
            };
        }

        let msg = `There are ${banList.length} ban(s):\n`;
        
        for(const banInfo of banList) {
            msg += `${banInfo.name}は${banInfo.source}によりBANされました \n理由: ${banInfo.reason}\n`;
        }

        return {
            status: CustomCommandStatus.Success,
            message: msg
        }
    }
};