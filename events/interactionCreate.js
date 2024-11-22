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
    await interactionUser.roles.add(role);

    const fields = interaction.fields.fields.map((field) => field.value);
    if (fields.some(field => !field || field.trim() === '')) {
      return interaction.reply({
        content: "กรุณากรอกข้อมูลให้ครบทุกช่อง",
        ephemeral: true,
      });
    }

    const [fullName, nickName, major, studentId, year] = fields;

    if (!/^\d{7}$/.test(studentId)) {
      return interaction.reply({
        content: "รหัสนักศึกษาไม่ถูกต้อง กรุณากรอกเป็นตัวเลข 7 หลัก",
        ephemeral: true,
      });
    }

    const hiddenStudentId = hideStudentId(studentId);

    const createVerifyEmbed = (isFullInfo = false) => {
      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle(`🎉 ยินดีต้อนรับ ${nickName} เข้าสู่เซิร์ฟเวอร์! 🎉`)
        .setDescription(`**${interactionUser.user}** ได้ยืนยันตัวตนแล้ว`)
        .setThumbnail(interactionUser.user.displayAvatarURL())
        .setTimestamp()
        .setFooter({ text: "ยินดีที่ได้รู้จัก!" });

      const fields = isFullInfo 
        ? [
            { name: "ชื่อจริง", value: fullName, inline: true },
            { name: "ชื่อเล่น", value: nickName, inline: true },
            { name: "ชั้นปี", value: year, inline: true },
            { name: "รหัสนักศึกษา", value: studentId, inline: true },
            { name: "สาขา", value: major, inline: true }
          ]
        : [
            { name: "ชื่อเล่น", value: nickName, inline: true },
            { name: "ชั้นปี", value: year, inline: true },
            { name: "รหัสนักศึกษา", value: hiddenStudentId, inline: true },
            { name: "สาขา", value: major, inline: true }
          ];

      embed.addFields(fields);
      return embed;
    };

    await interaction.guild.channels.cache
      .get(DISPLAY_CHANNEL_ID)
      .send({ embeds: [createVerifyEmbed(false)] });

    await interaction.guild.channels.cache
      .get(DISPLAY_FULL_CHANNEL_ID)
      .send({ embeds: [createVerifyEmbed(true)] });

    await interaction.guild.channels.cache
      .get(LOG_CHANNEL_ID)
      .send({ content: `**${interactionUser.user}** ได้ยืนยันตัวตนแล้ว` });

    await interaction.reply({
      content: "ยืนยันตัวตนเรียบร้อยแล้ว",
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error in verifyInputModal:", error);

    const errorMessages = {
      10062: "คำขอนี้ถูกประมวลผลไปแล้ว",
      50001: "บอทไม่มีสิทธิ์ในการเข้าถึงช่องนี้ กรุณาตรวจสอบสิทธิ์ของบอท",
      50013: "บอทไม่มีสิทธิ์ในการดำเนินการนี้ กรุณาตรวจสอบสิทธิ์ของบอท",
      DEFAULT: "เกิดข้อผิดพลาดในการยืนยันตัวตน โปรดลองอีกครั้งหรือติดต่อผู้ดูแลระบบ"
    };

    const errorMessage = errorMessages[error.code] || errorMessages.DEFAULT;
    const ephemeral = ![50001, 50013].includes(error.code);

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
      if (error.code === 10062) {
        errorMessage = "คำขอนี้ถูกประมวลผลไปแล้ว";
      }

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
