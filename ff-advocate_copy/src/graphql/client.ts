import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { createHttpLink } from "apollo-link-http";
import { onError } from "apollo-link-error";
import { ApolloLink } from "apollo-link";
import { RetryLink } from "apollo-link-retry";
import Config from "react-native-config";
import { logger } from "../utils/logging";
import fetch from "unfetch";

export const onboardingClient = new ApolloClient({
  link: ApolloLink.from([
    onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors)
        graphQLErrors.map(({ message, locations, path }) =>
          logger.error(
            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
          )
        );
      if (networkError)
        logger.warn(`[Network error onboardingClient]: ${networkError}`);
    }),
    createHttpLink({
      uri: Config.GRAPHQL_API,
      credentials: "same-origin",
      fetch: fetch
    })
  ]),
  cache: new InMemoryCache()
});

export const apiClient = new ApolloClient({
  link: ApolloLink.from([
    onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors)
        graphQLErrors.map(({ message, locations, path }) =>
          logger.error(
            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
          )
        );
      if (networkError)
        logger.warn(`[Network error apiClient]: ${networkError}`);
    }),
    createHttpLink({
      uri: Config.ANALYTICS_GRAPHQL_API,
      credentials: "same-origin",
      headers: {
        "content-type": "application/json"
      },
      fetch: fetch
    })
  ]),
  cache: new InMemoryCache()
});

export const analyticsClient = new ApolloClient({
  link: ApolloLink.from([
    new RetryLink({
      delay: {
        initial: 1500,
        max: Infinity,
        jitter: true
      },
      attempts: {
        max: 20,
        retryIf: error => !!error
      }
    }),
    createHttpLink({
      uri: Config.ANALYTICS_GRAPHQL_API,
      credentials: "same-origin",
      headers: {
        "content-type": "application/json"
      },
      fetch: fetch
    })
  ]),
  cache: new InMemoryCache()
});

export const allClients: ApolloClient<unknown>[] = [
  apiClient,
  analyticsClient,
  onboardingClient
];
