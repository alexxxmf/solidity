# Deploy workflow

Don't forget to setup your [serverless aws profile](https://serverless.com/framework/docs/providers/aws/guide/credentials#using-aws-profiles)

- `sls deploy function -f graphql -v` -- re-deploy updated function code
- `sls logs -f graphql -t` -- tail the logs for the function
- `sls deploy -v` -- deploy the whole thing

## ⚠️ Notes on production deployments

You can deploy to a cutom environment or the one we have at the moment, dev. If you want to deploy to a cutom one first, you need to create a custom domain in aws (API gateway).

```console
sls create_domain --stage nameThatYouWant
```

_This will take some time, up to 40 min to get the domain available to you._

Then you can deploy with:

```console
sls deploy --stage nameThatYouWant
```

_If you put there a different name you should expect an error related with `BasePathMappings`._

### `--stage` tag

If you don't use the custom tag `--stage` by default it uses `dev` as a tag (this is standard behavior in AWS, you can read about this in the official documentation).

Domain should be created just once so if you don't use tags you should expect `advocate-onboard-api-dev.freeformers.com` to be already created.
You will just need to do `sls deploy -v`.

### Deploy to PRODUCTION

```console
sls deploy --stage prod
```

If you check `resolveNames.js` to get more info about what we are doing for resolving domain names.

### Rolling back changes

Check the [version on AWS Lambda](https://eu-west-1.console.aws.amazon.com/lambda/home?region=eu-west-1#/functions/advocate-login-reminder-dev-graphql?tab=graph):

- Lambda > Functions > advocate-login-reminder-dev-graphql
- Qualifiers > Versions

Rolling back to the version 20

```console
sls rollback function -f graphql -v 20`
```
