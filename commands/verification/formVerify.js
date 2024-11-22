const { ActionRowBuilder } = require("discord.js");
const { VERIFY_CHANNEL_ID } = process.env;
const {
  SlashCommandBuilder,
  Interaction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

const verifyInputModal = () => {
  let fullName = new ActionRowBuilder().addComponents(
    new TextInputBuilder()
      .setCustomId("full_name")
      .setLabel("ชื่อ นามสกุล")
      .setPlaceholder("")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
  );
  let nickName = new ActionRowBuilder().addComponents(
    new TextInputBuilder()
      .setCustomId("nick_name")
      .setLabel("ชื่อเล่น (ภาษาไทย)")
      .setPlaceholder("")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
  );
  let major = new ActionRowBuilder().addComponents(
    new TextInputBuilder()
      .setCustomId("major")
      .setLabel("คณะ / สาขา")
      .setPlaceholder("คณะเทคโนโลยีสารสนเทศและการสื่อสาร สาขา ICT / DST")
      .setStyle(TextInputStyle.Short)
  );
  let studentId = new ActionRowBuilder().addComponents(
    new TextInputBuilder()
      .setCustomId("student_id")
      .setLabel("รหัสนักศึกษา")
      .setPlaceholder("6788000")
      .setStyle(TextInputStyle.Short)
  );
  let year = new ActionRowBuilder().addComponents(
    new TextInputBuilder()
      .setCustomId("year")
      .setLabel("ชั้นปี")
      .setPlaceholder("ปี 1")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
  );

  let modal = new ModalBuilder()
    .setCustomId("verify_modal")
    .setTitle("Verify | ยืนยันตัวตน")
    .addComponents(fullName, nickName, major, studentId, year);

  return modal;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("ยืนยันตัวตนเพื่อเข้าดิสกันเถอะ!")
    .setDefaultMemberPermissions(0),
  /**
   * @param {Interaction} interaction
   * @returns void
   */
  async execute(interaction) {
    if (!VERIFY_CHANNEL_ID) {
      console.error('VERIFY_CHANNEL_ID is not set in environment variables');
      return interaction.reply({
        content: "เกิดข้อผิดพลาดในการตั้งค่าระบบ กรุณาติดต่อแอดมิน",
        ephemeral: true
      });
    }

    if (interaction.channelId !== VERIFY_CHANNEL_ID) {
      return interaction.reply({
        content: "ไปยืนยันตัวคนที่ห้อง Verify นะครับ",
        ephemeral: true,
      });
    }

    const user = interaction.guild.members.cache.get(interaction.user.id);
    if (user.roles.cache.has(process.env.VERIFY_ROLE_ID))
      return interaction.reply({
        content: "ยืนยันตัวตนไปแล้ว",
        ephemeral: true,
      });

    await interaction.showModal(verifyInputModal());
  },
};
