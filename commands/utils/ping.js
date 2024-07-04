const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");
const moment = require("moment"); 
require("moment-duration-format"); 

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("ตรวจสอบสถานะและความหน่วงของบอท"),

  async execute(interaction) {
    await interaction.reply({ content: "🏓 กำลังโยนลูกปิงปอง...", ephemeral: true });

    try {
      const botLatency = Date.now() - interaction.createdTimestamp;
      const apiLatency = Math.round(interaction.client.ws.ping);
      const totalLatency = botLatency + apiLatency;

      const discordStatus = await fetch("https://discordstatus.com/api/v2/summary.json")
        .then(res => res.json())
        .catch(() => ({ status: { indicator: "none" } }));

      const uptime = moment.duration(interaction.client.uptime).format("d[d] h[h] m[m] s[s]");

      const embed = new EmbedBuilder()
        .setColor(totalLatency < 100 ? "#00ff00" : totalLatency < 200 ? "#ffa500" : "#ff0000")
        .setTitle("🏓 Pong!")
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .addFields(
          { name: "ความหน่วงของบอท", value: `${botLatency}ms`, inline: true },
          { name: "ความหน่วงของ API", value: `${apiLatency}ms`, inline: true },
          { name: "ความหน่วงรวม", value: `${totalLatency}ms`, inline: true },
          { name: "สถานะ Discord API", value: discordStatus.status.description || "N/A", inline: true },
          { name: "Uptime", value: uptime, inline: true },
          { name: "จำนวนผู้ใช้งาน", value: interaction.client.users.cache.size.toString(), inline: true },
          { name: "จำนวนเซิร์ฟเวอร์", value: interaction.client.guilds.cache.size.toString(), inline: true },
        );

      await interaction.followUp({ embeds: [embed], ephemeral: true }); // ส่ง embed โดยตรง
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการตอบกลับคำสั่ง ping:", error);
      await interaction.followUp({
        content: "ขออภัย เกิดข้อผิดพลาดในการตรวจสอบ ping",
        ephemeral: true,
      });
    }
  },
};
