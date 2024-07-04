const { Client, Events, ActivityType, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const moment = require('moment');
require('moment-duration-format');
const NodeCache = require('node-cache');

const nodeCache = new NodeCache({ stdTTL: 3600 }); 

const client = new Client({ intents: [GatewayIntentBits.Guilds] });


client.once(Events.ClientReady, async () => {
    const logChannelId = process.env.LOG_CHBOTS;

    let totalUsers = 0;
    for (const guild of client.guilds.cache.values()) {
        totalUsers += guild.memberCount;
    }

    async function updateAndSendEmbed() {
        try {
            const totalGuilds = client.guilds.cache.size;
            const totalChannels = client.channels.cache.size;
            const memoryUsage = Math.round(process.memoryUsage().rss / 1024 / 1024);
            const uptime = moment.duration(client.uptime).format("d[d] h[h] m[m] s[s]");

            const logChannel = await client.channels.fetch(logChannelId);
            if (!logChannel || !logChannel.isTextBased()) {
                console.error("Log channel not found or not a text channel");
                return;
            }

            const avatarURL = nodeCache.get(client.user.id) || client.user.displayAvatarURL({ size: 256 });
            nodeCache.set(client.user.id, avatarURL);

            const embed = new EmbedBuilder()
                .setColor("#0099ff")
                .setTitle("🚀 บอทพร้อมทำงาน!")
                .setDescription(`เข้าสู่ระบบในชื่อ **${client.user.tag}**`)
                .setThumbnail(avatarURL)
                .addFields([
                    { name: "📊 สถิติ", value: `\`\`\`Servers: ${totalGuilds.toLocaleString()}\nUsers: ${totalUsers.toLocaleString()}\nChannels: ${totalChannels.toLocaleString()}\`\`\``, inline: false },
                    { name: "⚙️ ระบบ", value: `\`\`\`Memory: ${memoryUsage} MB\nPing: ${client.ws.ping}ms\nUptime: ${uptime}\`\`\``, inline: false },
                ])
                .setTimestamp()
                .setFooter({ text: client.user.username, iconURL: avatarURL });

            const existingMessage = await logChannel.messages.fetch({ limit: 1 }).then(messages => messages.first());
            if (existingMessage) {
                await existingMessage.edit({ embeds: [embed] });
            } else {
                await logChannel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error("Error updating or sending embed:", error);
        }
    }

    await updateAndSendEmbed();

    setInterval(updateAndSendEmbed, 5000); 

    const activities = [
        { name: `กับผู้ใช้ ${totalUsers} คน`, type: ActivityType.Playing },
        { name: `ในเซิร์ฟเวอร์ ${client.guilds.cache.size} แห่ง`, type: ActivityType.Watching },
        { name: "Develop By DST04", type: ActivityType.Watching },
        { name: "ict.mahidol.ac.th", type: ActivityType.Watching },
    ];

    let currentActivityIndex = 0;
    async function updateActivity() {
        try {
            totalUsers = 0;
            for (const guild of client.guilds.cache.values()) {
                totalUsers += guild.memberCount;
            }
            activities[0].name = `กับผู้ใช้ ${totalUsers} คน`;

            client.user.setActivity(activities[currentActivityIndex]);
            currentActivityIndex = (currentActivityIndex + 1) % activities.length;
        } catch (error) {
            console.error("Error updating activity:", error);
        }
    }
    
    updateActivity(); 
    setInterval(updateActivity, 5000); 

    console.log(`Ready! Logged in as ${client.user.tag}`);

});

client.login(process.env.BOT_TOKEN); 
