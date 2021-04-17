const helpMessage =
`Adachi-BOT v1.4.0~
当前支持命令：
1. 绑定|#s 米游社通行证
2. 改绑|#c 米游社通行证
3. 查询|#gq (米游社通行证|@)
4. 查询|#uid 游戏内UID
5. 角色信息|#a 角色名
6. 祈愿十连|#w
7. 随机圣遗物|#r (秘境id)
8. 强化圣遗物|#i
9. 秘境id查询|#d`;


module.exports = Message => {
    bot.sendGroupMsg(Message.group_id, helpMessage).then();
}