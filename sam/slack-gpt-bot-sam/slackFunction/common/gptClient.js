const axios = require("axios");
const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");

const ssm = new SSMClient({ region: "ap-northeast-1" });
exports.askGPT = async (message) => {
  const openaiApiKey = await getSecretParam("/slack-gpt/openai_api_key");

  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
    }
  );
  return res.data.choices[0].message.content;
};



async function getSecretParam(name) {
  const command = new GetParameterCommand({
    Name: name,
    WithDecryption: true,
  });

  const result = await ssm.send(command);
  return result.Parameter.Value;
}