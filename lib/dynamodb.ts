import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const docClient = DynamoDBDocumentClient.from(client);

export const TABLES = {
  POSTS: process.env.DYNAMODB_POSTS_TABLE || "sagesure-social-posts",
  TOKENS: process.env.DYNAMODB_TOKENS_TABLE || "sagesure-social-tokens",
};

// Helper functions
export async function savePost(post: any) {
  await docClient.send(
    new PutCommand({
      TableName: TABLES.POSTS,
      Item: post,
    })
  );
}

export async function getPost(userId: string, postId: string) {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLES.POSTS,
      Key: { userId, postId },
    })
  );
  return result.Item;
}

export async function getUserPosts(userId: string) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLES.POSTS,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      ScanIndexForward: false, // newest first
    })
  );
  return result.Items || [];
}

export async function saveToken(userId: string, platform: string, token: any) {
  await docClient.send(
    new PutCommand({
      TableName: TABLES.TOKENS,
      Item: {
        userId,
        platform,
        ...token,
        updatedAt: new Date().toISOString(),
      },
    })
  );
}

export async function getToken(userId: string, platform: string) {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLES.TOKENS,
      Key: { userId, platform },
    })
  );
  return result.Item;
}

export async function getUserTokens(userId: string) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLES.TOKENS,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    })
  );
  return result.Items || [];
}
