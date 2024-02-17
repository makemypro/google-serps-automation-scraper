const request = require("request");


class openAIClient {
  constructor(openaiApiKey = null) {
    this.openaiApiKey = openaiApiKey || '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';
  }

  async get_chat_completion(messages, maxTokens = 1000, n = 1, model = "gpt-3.5-turbo") {
    const url = "https://api.openai.com/v1/chat/completions";
    const payload = {
      messages: messages,
      max_tokens: maxTokens,
      n: n,
      model: model
    };

    const options = {
      url: url,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.openaiApiKey}`,
      },
      json: payload,
    };

    console.log(`[openAIClient][get_chat_completion] Using ${this.openaiApiKey}...`)
    return new Promise((resolve, reject) => {
      request(options, function (error, httpResponse, body) {
        if (error) throw new Error(error);
        const choices = body.choices;
        const messages = choices.map(choice => choice.message.content);
        resolve(messages);
      });
    });
  }
}

// HOW TO USE

//const client = new openAIClient();
//
//// Example messages input
//const messages = [
//  { role: "system", content: "You are a helpful assistant." },
//  { role: "user", content: "Who won the world series in 2020?" }
//];
//
//client.get_chat_completion(messages)
//.then(result => {
//// Handle the result
//  console.log("Result:", result);
//})
//.catch(error => {
////   Handle the error
//  console.log("Error:", error);
//});