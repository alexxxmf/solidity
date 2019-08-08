import rollbar
from graphene_django.views import GraphQLView


class RollbarGraphQLView(GraphQLView):
    def execute_graphql_request(self, *args, **kwargs):
        """ Extract any exceptions and send them to Rollbar """
        result = super(RollbarGraphQLView, self).execute_graphql_request(
            *args, **kwargs
        )
        if result and result.errors:
            for error in result.errors:
                try:
                    raise error.original_error
                except Exception as e:
                    rollbar.report_exc_info()
        return result
