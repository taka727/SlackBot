/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */

const axios = require("axios");
const { askGPT, getSecretParam } = require("./common/gptClient");


exports.lambdaHandler = async (event, context) => {
  try {
    console.log("Slackイベント：", event);

    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    const slackBotToken = await getSecretParam("/slack-gpt/slack_bot_token");
    // Slackの初期検証用
    if (body.type === "url_verification") {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ challenge: body.challenge }),
      };
    }

    if (body.event && body.event.type === "app_mention") {
      const userMessage = body.event.text.replace(/<@.*?>/g, "").trim();
      const slackChannel = body.event.channel;

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
            Authorization: `Bearer ${slackBotToken}`,
            "Content-Type": "application/json",
          },
        }
      );
    }
    return {
      statusCode: 200,
      body: "OK",
    };
  } catch (error) {
    console.error("Lambdaエラー:", error.response?.data || error.message);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    }
  }

};
