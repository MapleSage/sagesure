require("dotenv").config();
const { TableClient, AzureNamedKeyCredential } = require("@azure/data-tables");

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

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

async function testStorage() {
  try {
    console.log("Testing Azure Table Storage...\n");

    const { accountName, accountKey } = parseConnectionString(connectionString);
    console.log("Account Name:", accountName);

    const credential = new AzureNamedKeyCredential(accountName, accountKey);
    const tokensTable = new TableClient(
      `https://${accountName}.table.core.windows.net`,
      "tokens",
      credential
    );

    // Try to create table
    console.log("\n1. Creating 'tokens' table...");
    try {
      await tokensTable.createTable();
      console.log("✅ Table created successfully");
    } catch (error) {
      if (error.statusCode === 409) {
        console.log("✅ Table already exists");
      } else {
        throw error;
      }
    }

    // Try to list entities
    console.log("\n2. Listing all tokens...");
    const entities = tokensTable.listEntities();
    let count = 0;
    for await (const entity of entities) {
      count++;
      console.log(
        `   - User: ${entity.partitionKey}, Platform: ${entity.rowKey}`
      );
    }
    console.log(`✅ Found ${count} token(s)`);

    console.log("\n✅ Azure Table Storage is working correctly!");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("Full error:", error);
  }
}

testStorage();
