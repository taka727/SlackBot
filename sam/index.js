const axios = require("axios");
const { askGPT } = require("../common/gptClient");

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  // Slackの初期検証用
  if (type === "url_verification") {
    res.setHeader("Content-Type", "application/json");
    return res.status(200).send(JSON.stringify({ challenge }));
  }

  if(body.event && body.event.type === "app_mention"){
    const userMessage = body.event.text.replace(/<@.*?>/g, "").trim();
    const slackChannel = body.event.channel;

    try {
      const gptRes = await askGPT(userMessage);

      // Slack に返信
      await axios.post(
        "https://slack.com/api/chat.postMessage",
        {
          channel: slackChannel,
          text: gptRes,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
    }catch (error) {
      console.error("エラー:", error.response?.data || error.message);
    }
  }
  return res.sendStatus(200);
};
