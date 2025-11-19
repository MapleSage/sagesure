// WhatsApp Business API integration
// Requires WhatsApp Business API account and phone number

export async function postToWhatsApp(
  accessToken: string,
  content: string,
  mediaUrl?: string
) {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!phoneNumberId) {
      throw new Error("WhatsApp phone number ID not configured");
    }

    // WhatsApp Business API endpoint
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    let messageData: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: process.env.WHATSAPP_RECIPIENT_NUMBER, // Target number or use broadcast list
      type: mediaUrl ? "image" : "text",
    };

    if (mediaUrl) {
      messageData.image = {
        link: mediaUrl,
        caption: content,
      };
    } else {
      messageData.text = {
        body: content,
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messageData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("WhatsApp API error:", data);
      return {
        success: false,
        error: data.error?.message || "Failed to send WhatsApp message",
        platform: "whatsapp",
      };
    }

    return {
      success: true,
      platform: "whatsapp",
      postId: data.messages?.[0]?.id,
      data,
    };
  } catch (error: any) {
    console.error("WhatsApp posting error:", error);
    return {
      success: false,
      error: error.message,
      platform: "whatsapp",
    };
  }
}

// Send to WhatsApp broadcast list
export async function postToWhatsAppBroadcast(
  accessToken: string,
  content: string,
  mediaUrl?: string,
  recipientNumbers: string[]
) {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!phoneNumberId) {
      throw new Error("WhatsApp phone number ID not configured");
    }

    const results = [];

    for (const number of recipientNumbers) {
      const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

      let messageData: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: number,
        type: mediaUrl ? "image" : "text",
      };

      if (mediaUrl) {
        messageData.image = {
          link: mediaUrl,
          caption: content,
        };
      } else {
        messageData.text = {
          body: content,
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      });

      const data = await response.json();

      results.push({
        number,
        success: response.ok,
        messageId: data.messages?.[0]?.id,
        error: data.error?.message,
      });
    }

    return {
      success: true,
      platform: "whatsapp",
      results,
    };
  } catch (error: any) {
    console.error("WhatsApp broadcast error:", error);
    return {
      success: false,
      error: error.message,
      platform: "whatsapp",
    };
  }
}
