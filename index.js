const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

app.post("/slack/events", async (req, res) => {
  const { type, challenge, event } = req.body;

  // Slackの初期検証用
  if (type === "url_verification") {
    res.setHeader("Content-Type", "application/json");
    return res.status(200).send(JSON.stringify({ challenge }));
  }

  // メンションされたとき
  if (event && event.type === "app_mention") {
    const userMessage = event.text.replace(/<@.*?>/g, "").trim();
    const slackChannel = event.channel;

    // OpenAI に問い合わせ
    const gptRes = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [{ role: "user", content: userMessage }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const reply = gptRes.data.choices[0].message.content;

    // Slack に返信
    await axios.post(
      "https://slack.com/api/chat.postMessage",
      {
        channel: slackChannel,
        text: reply,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.sendStatus(200);
  }

  res.sendStatus(200);
});

app.listen(3000, () => console.log("Server is running on port 3000"));
