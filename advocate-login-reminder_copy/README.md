# Advocate Login Reminder

> Serverless GraphQL service for advocates using the Digital Mentor app.

- [Getting started](#getting-started)
- [Develop workflow](#develop-workflow)
- [Deploy workflow](docs/deploy.md)
- [Database](docs/database.md)

## Getting started

Use `yarn`, make sure you have Serverless globally available (`yarn global add serverless`), and add a `.env` file like:

```bash
MANDRILL_API_KEY="MANDRILL API KEY HERE"
```

## Develop workflow

```console
sls dynamodb install
mkdir db
sls dynamodb start --dbPath db
sls offline start --noStart
```

Open https://pulse.freeformers.com/admin/taxonomy/graphiql/ and change the **GraphQL service URL** to http://localhost:3000/graphql

Find, Kill, and Restart a local DynamoDB Process

```console
kill `ps -ax |grep Dynamo`
```

### Making changes

- `handler.ts` is the entrypoint.
- We use generated Typescript types that are based on `schema.graphql`.
- To refresh these, call `yarn codegen`.
