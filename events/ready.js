const { Client, Events, ActivityType, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const moment = require('moment');
require('moment-duration-format');
const NodeCache = require('node-cache');
const axios = require('axios');
const figlet = require('figlet');

const nodeCache = new NodeCache({ stdTTL: 3600 }); 

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences] });

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

            // เพิ่มข้อมูลเวลาปัจจุบันของประเทศไทย
            const thaiTime = moment().utcOffset('+07:00').format('LLLL');

            // เพิ่มการดึงข้อมูล quote แบบสุ่ม
            const quote = await getRandomQuote();

            const embed = new EmbedBuilder()
                .setColor("#0099ff")
                .setTitle("🚀 บอทพร้อมทำงาน!")
                .setDescription(`เข้าสู่ระบบในชื่อ **${client.user.tag}**`)
                .setThumbnail(avatarURL)
                .addFields([
                    { name: "📊 สถิติ", value: `\`\`\`Servers: ${totalGuilds.toLocaleString()}\nUsers: ${totalUsers.toLocaleString()}\nChannels: ${totalChannels.toLocaleString()}\`\`\``, inline: false },
                    { name: "⚙️ ระบบ", value: `\`\`\`Memory: ${memoryUsage} MB\nPing: ${client.ws.ping}ms\nUptime: ${uptime}\`\`\``, inline: false },
                    { name: "🕒 เวลาปัจจุบัน (ประเทศไทย)", value: thaiTime, inline: false },
                    { name: "💡 Quote of the moment", value: quote, inline: false },
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

    setInterval(updateAndSendEmbed, 60000); // อัพเดททุก 1 นาที

    const activities = [
        { name: `กับผู้ใช้ ${totalUsers} คน`, type: ActivityType.Playing },
        { name: `ในเซิร์ฟเวอร์ ${client.guilds.cache.size} แห่ง`, type: ActivityType.Watching },
        { name: "Develop By DST04", type: ActivityType.Watching },
        { name: "ict.mahidol.ac.th", type: ActivityType.Watching },
        { name: "ให้คำปรึกษาด้าน IT", type: ActivityType.Listening },
        { name: "พัฒนาตัวเองอยู่เสมอ", type: ActivityType.Competing },
    ];

    let currentActivityIndex = 0;
    async function updateActivity() {
        try {
            totalUsers = 0;
            for (const guild of client.guilds.cache.values()) {
                totalUsers += guild.memberCount;
            }
            activities[0].name = `กับผู้ใช้ ${totalUsers} คน`;

            const activity = activities[currentActivityIndex];
            client.user.setActivity(activity.name, { type: activity.type });
            currentActivityIndex = (currentActivityIndex + 1) % activities.length;
        } catch (error) {
            console.error("Error updating activity:", error);
        }
    }
    
    updateActivity(); 
    setInterval(updateActivity, 10000); // เปลี่ยนทุก 10 วินาที

    console.log(figlet.textSync('Bot Ready!', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    }));
    console.log(`Logged in as ${client.user.tag}`);
});

async function getRandomQuote() {
    try {
        const https = require('https');
        const response = await axios.get('https://api.quotable.io/random', {
            httpsAgent: new https.Agent({  
                rejectUnauthorized: false
            })
        });
        return `"${response.data.content}" - ${response.data.author}`;
    } catch (error) {
        console.error("Error fetching quote:", error);
        return "ไม่สามารถดึงข้อมูล quote ได้ในขณะนี้";
    }
}

client.login(process.env.BOT_TOKEN); 
