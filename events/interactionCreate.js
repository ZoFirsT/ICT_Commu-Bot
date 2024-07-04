const { Events, Interaction, EmbedBuilder } = require("discord.js");
const {
  VERIFY_ROLE_ID,
  LOG_CHANNEL_ID,
  DISPLAY_CHANNEL_ID,
  DISPLAY_FULL_CHANNEL_ID,
} = process.env;

/**
 * @param {Interaction} interaction
 * @returns void
 */
const verifyInputModal = async (interaction) => {
  try {
    const interactionUser = interaction.guild.members.cache.get(
      interaction.user.id
    );

    if (interactionUser.roles.cache.has(VERIFY_ROLE_ID)) {
      return interaction.reply({
        content: "ยืนยันตัวตนไปแล้ว",
        ephemeral: true,
      });
    }

    const role = interaction.guild.roles.cache.find(
      (r) => r.id === VERIFY_ROLE_ID
    );
    await interactionUser.roles.add(role); // Use interactionUser to add the role

    const [fullName, nickName, major, studentId, year] =
      interaction.fields.fields.map((field) => field.value);

    const hiddenStudentId = hideStudentId(studentId);

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(`🎉 ยินดีต้อนรับ ${nickName} เข้าสู่เซิร์ฟเวอร์! 🎉`)
      .setDescription(`**${interactionUser.user}** ได้ยืนยันตัวตนแล้ว`)
      .setThumbnail(interactionUser.user.displayAvatarURL())
      .addFields(
        { name: "ชื่อเล่น", value: nickName, inline: true },
        { name: "ชั้นปี", value: year, inline: true },
        { name: "รหัสนักศึกษา", value: hiddenStudentId, inline: true },
        { name: "สาขา", value: major, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: "ยินดีที่ได้รู้จัก!" });

    const Fullembed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(`🎉 ยินดีต้อนรับ ${nickName} เข้าสู่เซิร์ฟเวอร์! 🎉`)
      .setDescription(`**${interactionUser.user}** ได้ยืนยันตัวตนแล้ว`)
      .setThumbnail(interactionUser.user.displayAvatarURL())
      .addFields(
        { name: "ชื่อจริง", value: fullName, inline: true },
        { name: "ชื่อเล่น", value: nickName, inline: true },
        { name: "ชั้นปี", value: year, inline: true },
        { name: "รหัสนักศึกษา", value: studentId, inline: true },
        { name: "สาขา", value: major, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: "ยินดีที่ได้รู้จัก!" });

    await interaction.guild.channels.cache
      .get(DISPLAY_CHANNEL_ID)
      .send({ embeds: [embed] });

    await interaction.guild.channels.cache
      .get(DISPLAY_FULL_CHANNEL_ID)
      .send({ embeds: [Fullembed] });


    await interaction.guild.channels.cache
      .get(LOG_CHANNEL_ID)
      .send({ content: `**${interactionUser.user}** ได้ยืนยันตัวตนแล้ว` });

    await interaction.reply({
      content: "ยืนยันตัวตนเรียบร้อยแล้ว",
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error in verifyInputModal:", error);

    let errorMessage = "เกิดข้อผิดพลาดในการยืนยันตัวตน โปรดลองอีกครั้งหรือติดต่อผู้ดูแลระบบ";
    let ephemeral = true;

    if (error.code === 10062) {
      errorMessage = "คำขอนี้ถูกประมวลผลไปแล้ว";
    } else if (error.code === 50001) { // Missing Access error
      errorMessage = "บอทไม่มีสิทธิ์ในการเข้าถึงช่องนี้ กรุณาตรวจสอบสิทธิ์ของบอท";
      ephemeral = false; // แสดงข้อความนี้ให้ทุกคนเห็น เพื่อให้ผู้ดูแลระบบทราบ
    } else if (error.code === 50013) { // Missing Permissions error
      errorMessage = "บอทไม่มีสิทธิ์ในการดำเนินการนี้ กรุณาตรวจสอบสิทธิ์ของบอท";
      ephemeral = false; // แสดงข้อความนี้ให้ทุกคนเห็น เพื่อให้ผู้ดูแลระบบทราบ
    }

    // ตอบกลับ/แก้ไขข้อความเดิมถ้าเป็นไปได้
    if (interaction.replied || interaction.deferred) {
      try {
        await interaction.followUp({ content: errorMessage, ephemeral });
      } catch (followUpError) {
        console.error("Failed to follow up:", followUpError);
      }
    } else {
      try {
        await interaction.reply({ content: errorMessage, ephemeral });
      } catch (replyError) {
        console.error("Failed to reply:", replyError);
      }
    }
  }
  
};

const hideStudentId = (studentId) => {
  return studentId.slice(0, 4) + "xxx";
};

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
          console.error(`ไม่พบคำสั่ง ${interaction.commandName} ในระบบ!`);
          return;
        }

        await command.execute(interaction);
      } else if (interaction.isModalSubmit()) {
        if (interaction.customId === "verify_modal") {
          await verifyInputModal(interaction);
        }
      }
    } catch (error) {
      console.error("Error handling interaction:", error);

      let errorMessage = "เกิดข้อผิดพลาดในการประมวลผลคำขอของคุณ";
      if (error.code === 10062) { // Interaction has already been acknowledged.
        errorMessage = "คำขอนี้ถูกประมวลผลไปแล้ว";
      }

      // ตอบกลับข้อความเดิมถ้าเป็นไปได้
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: errorMessage,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: errorMessage,
          ephemeral: true,
        });
      }
    }
  },
};
