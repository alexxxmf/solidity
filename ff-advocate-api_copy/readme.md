# Advocate API

AWS Lambda + Serverless + Django + Graphene + PostgreSQL

## Deployment

Deployment is automated through CircleCI on commits to the `master` branch. CircleCI will run a Django database migration and then execute a Serverless deployment.

### Local Development

1. Set up your `.env`
2. Run `sls wsgi serve`
3. Visit http://localhost:5000/graphql/

Set up a `.env` file with `DATABASE_URL`, `DJANGO_SECRET_KEY` and `DJANGO_DEBUG` options (Django will complain about the absence of any necessary environment variables anyway). You can run the application as if it's a normal Django app (through `./manage.py`), but particularly effective is `sls wsgi serve` -- this will basically do `runserver`, but wrapped up in a Lambda/(Local) API Gateway.

## Architecture

It's a plain old Django app, just without a meaningful front-end. It uses Graphene (and Graphene-Django) to provide a GraphQL API, based around working with Django models. You can test out functionality through a GraphiQL front-end at (in-development) http://localhost:5000/graphql/

## Snippets

```bash
pip-sync requirements.txt test-requirements.txt
pip-compile --output-file requirements.txt requirements.in
pip-compile --output-file test-requirements.txt test-requirements.in
sls deploy --aws-s3-accelerate
sls wsgi serve
```
