import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { createHttpLink } from "apollo-link-http";
import { onError } from "apollo-link-error";
import { ApolloLink } from "apollo-link";
import fetch from "node-fetch";

const apiClient = new ApolloClient({
  link: ApolloLink.from([
    onError(({ graphQLErrors }) => {
      if (graphQLErrors)
        graphQLErrors.map(({ message, locations, path }) =>
          console.error(
            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
          )
        );
    }),
    createHttpLink({
      uri: process.env.ADVOCATE_GRAPHQL_API,
      credentials: "same-origin",
      headers: {
        "content-type": "application/json"
      },
      fetch: fetch
    })
  ]),
  cache: new InMemoryCache()
});

export default apiClient;
