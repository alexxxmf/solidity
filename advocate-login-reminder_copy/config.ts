import * as AWS from "aws-sdk";
import { Mandrill } from "mandrill-api";

export const dynamoDb = new AWS.DynamoDB.DocumentClient(
  process.env.IS_OFFLINE ? { region: "localhost", endpoint: "http://localhost:8000" } : {}
);

export const mandrillClient = new Mandrill(process.env.MANDRILL_API_KEY);
