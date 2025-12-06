//@ts-check

import { CommandPermissionLevel } from "@minecraft/server";
/*
    Anything can run this level.
    Any = 0,

    Any operator can run this command, including command blocks. //BDSの場合、GameDirectors推奨(playerからも実行可能)
    GameDirectors = 1,

    Any operator can run this command, but NOT command blocks. //BDSの場合、Adminだとプレイヤーから実行不可能
    Admin = 2, 

    Any server host can run this command.
    Host = 3,

    Only dedicated server can run this command.
    Owner = 4,
*/

export default({
    permission: CommandPermissionLevel.Admin,
})