# Book a Coach Webhook for [https://freeformers.com/champion-welcome/](https://freeformers.com/champion-welcome/)

> This service will listen to calendly webhooks and feed the Advocate API.

## How it works

```
┌─────────────────────┐               ┌────────────┐
│                     │               │            │
│  Wordpress Website  │               │  Calendly  │
│       activity      │────Trigger───▶│  Webhook   │
│                     │               │            │
└─────────────────────┘               └────────────┘
                                            │
                     ┌────POST──────────────┘
                     │
          ┌──────────▼─────────┐
          │ ┌────────────────┐ │
          │ │  API Gateway   │ │
          │ │    Endpoint    │ │
          │ └────────────────┘ │
          └─────────┬──────────┘
                    │
                    │
         ┌──────────▼──────────┐
         │ ┌────────────────┐  │
         │ │                │  │
         │ │     Lambda     │  │
         │ │    Function    │  │
         │ │                │  │
         │ └────────────────┘  │
         └─────────────────────┘
                    │
                    │
                    ▼
         ┌──────────────────────┐
         │                      │
         │      Sync Datas      │
         │  with advocate-api   │
         │                      │
         └──────────────────────┘
```

## Getting Started

2. Deploy the service

```console
sls deploy
```

After the deploy has finished you should see something like:

```bash
Service Information
service: calendly-webhook-listener
stage: dev
region: us-east-1
api keys:
  None
endpoints:
  POST - https://abcdefg.execute-api.us-east-1.amazonaws.com/dev/webhook
functions:
  calendly-webhook-.....calendly-webhook-listener-dev-calendlyWebhookListener
```

3. Manually trigger/test the webhook from settings or do something calendly account.

You can tail the logs of the lambda function with the below command to see it running.

```bash
serverless logs -f calendlyWebhookListener -t
```

You should see the event from calendly in the lambda functions logs.
