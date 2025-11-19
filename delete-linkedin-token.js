const { TableClient, AzureNamedKeyCredential } = require("@azure/data-tables");
require("dotenv").config({ path: ".env" });

function parseConnectionString(connStr) {
  const parts = connStr.split(";");
  const accountName = parts
    .find((p) => p.startsWith("AccountName="))
    ?.split("=")[1];
  const accountKey = parts
    .find((p) => p.startsWith("AccountKey="))
    ?.split("=")[1];
  return { accountName, accountKey };
}

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const { accountName, accountKey } = parseConnectionString(connectionString);
const credential = new AzureNamedKeyCredential(accountName, accountKey);

const tokensTable = new TableClient(
  `https://${accountName}.table.core.windows.net`,
  "tokens",
  credential
);

async function deleteLinkedInToken() {
  // Get your userId from cookies or pass it as argument
  const userId = process.argv[2];

  if (!userId) {
    console.log("Usage: node delete-linkedin-token.js <userId>");
    console.log("You can find your userId in browser cookies");
    return;
  }

  try {
    await tokensTable.deleteEntity(userId, "linkedin");
    console.log(`✅ Deleted LinkedIn token for user: ${userId}`);
    console.log("You can now reconnect LinkedIn from the dashboard");
  } catch (error) {
    if (error.statusCode === 404) {
      console.log("No LinkedIn token found for this user");
    } else {
      console.error("Error:", error);
    }
  }
}

deleteLinkedInToken();
