// const https = require("https");
const axios = require("axios");

exports.handler = async (event) => {
  const VERIFY_TOKEN = 'YOUR_VERIFY_TOKEN';
  const WHATSAPP_TOKEN = 'YOUR_AUTHENTICATION_TOKEN'

  let response;
  if (event?.requestContext?.http?.method === "GET") {
    // https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
    // to learn more about GET request for webhook verification
    let queryParams = event?.queryStringParameters;
    if (queryParams != null) {
      const mode = queryParams["hub.mode"];
      if (mode == "subscribe") {
        const verifyToken = queryParams["hub.verify_token"];
        if (verifyToken == VERIFY_TOKEN) {
          let challenge = queryParams["hub.challenge"];
          response = {
            statusCode: 200,
            body: parseInt(challenge),
            isBase64Encoded: false,
          };
        } else {
          const responseBody = "Error, wrong validation token";
          response = {
            statusCode: 403,
            body: JSON.stringify(responseBody),
            isBase64Encoded: false,
          };
        }
      } else {
        const responseBody = "Error, wrong mode";
        response = {
          statusCode: 403,
          body: JSON.stringify(responseBody),
          isBase64Encoded: false,
        };
      }
    } else {
      const responseBody = "Error, no query parameters";
      response = {
        statusCode: 403,
        body: JSON.stringify(responseBody),
        isBase64Encoded: false,
      };
    }
  } else if (event?.requestContext?.http?.method === "POST") {
    // process POST request (WhatsApp chat messages)
    // https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
    // to learn about WhatsApp text message payload structure
    console.log(event.body);
    let body = JSON.parse(event.body);
    // console.log(body, "Body======");
    let entries = body.entry;
    for (let entry of entries) {
      for (let change of entry.changes) {
        let value = change.value;
        if (value != null) {
          let phone_number_id = value.metadata.phone_number_id;
          if (value.messages != null) {
            for (let message of value.messages) {
              let from = message.from;
              if (message.type === "text") {
                // let message_body = message.text.body;
                await sendCityInteractiveMessage(
                  phone_number_id,
                  WHATSAPP_TOKEN,
                  from
                );
                const responseBody = "Done";
                response = {
                  statusCode: 200,
                  body: JSON.stringify(responseBody),
                  isBase64Encoded: false,
                };
              } else if (message.type === "interactive") {
                // let from = message.from;
                if (message.interactive.type === "list_reply") {
                  let messageinfo =
                    message.interactive.list_reply.id.split("_");
                  if (messageinfo[0] === "city") {
                    await sendCategoryInteractiveMessage(
                      phone_number_id,
                      WHATSAPP_TOKEN,
                      from,
                      messageinfo[1]
                    );
                  } else if (messageinfo[0] === "cat") {
                    await sendReply(
                      phone_number_id,
                      WHATSAPP_TOKEN,
                      from,
                      `${messageinfo[2]} and ${messageinfo[3]}`
                    );
                  }
                  const responseBody = "Done";
                  response = {
                    statusCode: 200,
                    body: JSON.stringify(responseBody),
                    isBase64Encoded: false,
                  };
                } else if (message.interactive.type === "button_reply") {
                  let messageinfo = message.interactive.button_reply.id;
                  if (messageinfo === "address_form") {
                    await sendAddressDeliveryMessage(
                      phone_number_id,
                      WHATSAPP_TOKEN,
                      from
                    );
                  } else if (messageinfo === "location") {
                    await sendLocationMessage(
                      phone_number_id,
                      WHATSAPP_TOKEN,
                      from
                    );
                  }
                }
              } else if (message.type === "order") {
                await sendReplyButtons(phone_number_id, WHATSAPP_TOKEN, from);
                // for (const item of message.order.product_items) {
                // }
              }
            }
          }
        }
      }
    }
  } else {
    const responseBody = "Unsupported method";
    response = {
      statusCode: 403,
      body: JSON.stringify(responseBody),
      isBase64Encoded: false,
    };
  }

  return response;
};

const sendReply = async (
  phone_number_id,
  whatsapp_token,
  to,
  reply_message
) => {
  try {
    console.log(phone_number_id, to, reply_message);
    let data = JSON.stringify({
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: {
        body: `Thank you for checking the bot Your City & Cat are ${reply_message}`.,
      },
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `https://graph.facebook.com/v17.0/${phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${whatsapp_token}`,
        "Content-Type": "application/json",
      },
      data: data,
    };
    const response = await axios.request(config);
    console.log(response);
  } catch (err) {
    console.log(err);
  }
};

const sendCityInteractiveMessage = async (
  phone_number_id,
  whatsapp_token,
  to
) => {
  try {
    let data = JSON.stringify({
      messaging_product: "whatsapp",
      to: to,
      type: "interactive",
      interactive: {
        type: "list",
        body: {
          text: "Welcome to Demo Bot, Please select a city from the options",
        },
        action: {
          button: "Choose a City",
          sections: [
            {
              title: "Choose a City",
              rows: [
                {
                  id: "city_hyderabad",
                  title: "Hyderabad",
                  //   description: "row-description-content-here",
                },
                {
                  id: "city_delhi",
                  title: "Delhi",
                  //   description: "row-description-content-here",
                },
                {
                  id: "city_mumbai",
                  title: "Mumbai",
                  //   description: "row-description-content-here",
                },
                {
                  id: "city_banglore",
                  title: "Banglore",
                  //   description: "row-description-content-here",
                },
                {
                  id: "city_vizag",
                  title: "Vizag",
                  //   description: "row-description-content-here",
                },
              ],
            },
            // {
            //   title: "your-section-title-content-here",
            //   rows: [
            //     {
            //       id: "unique-row-identifier-here",
            //       title: "row-title-content-here",
            //       description: "row-description-content-here",
            //     },
            //   ],
            // },
          ],
        },
      },
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `https://graph.facebook.com/v17.0/${phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${whatsapp_token}`,
        "Content-Type": "application/json",
      },
      data: data,
    };
    const response = await axios.request(config);
    console.log(response);
  } catch (err) {
    console.log(err);
  }
};

const sendCategoryInteractiveMessage = async (
  phone_number_id,
  whatsapp_token,
  to,
  city
) => {
  try {
    let data = JSON.stringify({
      messaging_product: "whatsapp",
      to: to,
      type: "interactive",
      interactive: {
        type: "list",
        body: {
          text: "Please select a category From the below Options",
        },
        action: {
          button: "Select Category",
          sections: [
            {
              title: "Choose a Category",
              rows: [
                {
                  id: `cat_${city}_chains`,
                  title: "Chain",
                },
                {
                  id: `cat_${city}_necklace`,
                  title: "necklace",
                },
                {
                  id: `cat_${city}_bangles`,
                  title: "Bangles",
                },
                {
                  id: `cat_${city}_silver`,
                  title: "Silver Items",
                },
              ],
            },
          ],
        },
      },
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `https://graph.facebook.com/v17.0/${phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${whatsapp_token}`,
        "Content-Type": "application/json",
      },
      data: data,
    };
    const response = await axios.request(config);
    console.log(response);
  } catch (err) {
    console.log(err);
  }
};

const sendMultipleProductMessage = async (
  phone_number_id,
  whatsapp_token,
  to,
  category
) => {
  try {
    let data = JSON.stringify({
      messaging_product: "whatsapp",
      to: to,
      type: "interactive",
      interactive: {
        type: "product_list",
        header: {
          type: "text",
          text: `Jewellery Store ${category}`,
        },
        body: {
          text: "We are dedicated to providing our customers with the safest and cleanest products, Please select products from below",
        },
        action: {
          catalog_id: "176713595394228",
          sections: [
            {
              title: "Jewellery Products",
              product_items: [
                {
                  product_retailer_id: "tc5k2e4gfa",
                },
                {
                  product_retailer_id: "wkey35bg0x",
                },
              ],
            },
          ],
        },
      },
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `https://graph.facebook.com/v17.0/${phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${whatsapp_token}`,
        "Content-Type": "application/json",
      },
      data: data,
    };
    const response = await axios.request(config);
    console.log(response);
  } catch (err) {
    console.log(JSON.stringify(err));
  }
};

const sendAddressDeliveryMessage = async (
  phone_number_id,
  whatsapp_token,
  to
) => {
  try {
    let data = JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "interactive",
      interactive: {
        type: "address_message",
        body: {
          text: "Thanks for your order! Tell us what address you'd like this order delivered to.",
        },
        action: {
          name: "address_message",
          parameters: {
            country: "IN",
          },
        },
      },
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `https://graph.facebook.com/v17.0/${phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${whatsapp_token}`,
        "Content-Type": "application/json",
      },
      data: data,
    };
    const response = await axios.request(config);
    console.log(response);
  } catch (err) {
    console.log(JSON.stringify(err));
  }
};

const sendLocationMessage = async (phone_number_id, whatsapp_token, to) => {
  try {
    let data = JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "interactive",
      interactive: {
        type: "location_request_message",
        body: {
          type: "text",
          text: "Please Send Your Current Location For Address",
        },
        action: {
          name: "send_location",
        },
      },
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `https://graph.facebook.com/v17.0/${phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${whatsapp_token}`,
        "Content-Type": "application/json",
      },
      data: data,
    };
    const response = await axios.request(config);
    console.log(response);
  } catch (err) {
    console.log(JSON.stringify(err));
  }
};

const sendReplyButtons = async (phone_number_id, whatsapp_token, to) => {
  try {
    let data = JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: "Please select an option for sending the delivery",
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "address_form",
                title: "Fill Address",
              },
            },
            {
              type: "reply",
              reply: {
                id: "location",
                title: "Send Location",
              },
            },
          ],
        },
      },
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `https://graph.facebook.com/v17.0/${phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${whatsapp_token}`,
        "Content-Type": "application/json",
      },
      data: data,
    };
    const response = await axios.request(config);
    console.log(response);
  } catch (err) {
    console.log(JSON.stringify(err));
  }
};
