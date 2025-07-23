const Notification = require("../model/notification.Schema");
const admin = require("firebase-admin");
require("dotenv").config();
console.log("env file:", process.env);


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: process.env.TYPE,
      project_id: process.env.PROJECT_ID,
      private_key_id: process.env.PRIVATE_KEY_ID,
      private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.CLIENT_EMAIL,
      client_id: process.env.CLIENT_ID,
      auth_uri: process.env.AUTH_URI,
      token_uri: process.env.TOKEN_URI,
      auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
      universe_domain: process.env.UNIVERSE_DOMAIN
    }),
  });
}

exports.sendNotification = async (data) => {
  console.log(data.fcmToken)
  try {
    let notificationCreated
    if(!data?.onlyPushNotification){
       notificationCreated = await Notification.create(data);
    }
    // io.emit("notificationCreated", {
    //   message: "A New Notification Added",
    // });
    // Check if FCM token is present
    if (!data?.fcmToken) {
      console.warn("FCM token missing — notification not sent.");
      return notificationCreated;
    }
    // Prepare FCM message
    const message = {
      notification: {
        title: data?.title || "Default Title",
        body: data?.subTitle || "Default Body",
        image: data?.icon || null,
      },
      token: data.fcmToken,
    };
    // Send notification via Firebase
    const response = await admin.messaging().send(message);
    console.log("Notification sent successfully:", response);

    return {
      notification: notificationCreated || "Notify",
      fcmResponse: response,
    };
  } catch (error) {
    
    // If token invalid or unregistered — handle & remove token from DB if you store it
    if (error.errorInfo?.code === "messaging/registration-token-not-registered") {
      console.warn("❌ Invalid/expired FCM token — should delete from DB if stored.");
      // Example: await User.updateOne({ fcmToken: data.fcmToken }, { $unset: { fcmToken: "" } });
    } else {
      console.error("❌ Error sending notification:", error);
    }
  }
};