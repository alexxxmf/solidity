/* tslint:disable */

export type Maybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export enum AppPlatform {
  Ios = "ios",
  Android = "android"
}

export type CheckLoginTokenResult = {
  /** Was the token valid for login */
  valid: Scalars["Boolean"];
  /** If valid, the user options to use in the app */
  userOptions: Maybe<UserOptions>;
  /** Persistent user token to use in the app */
  persistentUserToken: Maybe<Scalars["String"]>;
};

export type CheckProgrammeCodeResult = {
  /** Was the token valid for login */
  valid: Scalars["Boolean"];
  /** If valid, the user options to use in the app */
  userOptions: Maybe<UserOptions>;
};

export type DeliveryMetadata = {
  location: Maybe<Location>;
};

export type Flags = {
  notes: Maybe<Scalars["Boolean"]>;
  print: Maybe<Scalars["Boolean"]>;
  download: Maybe<Scalars["Boolean"]>;
  flash: Maybe<Scalars["Boolean"]>;
  participants: Maybe<Scalars["Boolean"]>;
  attributes: Maybe<Scalars["Boolean"]>;
  participantsWheel: Maybe<Scalars["Boolean"]>;
};

export type GetPersistentUserOptionsResult = {
  /** Persistent user options to use in the app */
  userOptions: Maybe<UserOptions>;
};

export type ListUserProgrammesItem = {
  /** The title of the programme */
  brandingTitle: Scalars["String"];
  /** The ID of the programme */
  programmeId: Scalars["Int"];
  /** Is this the user's current programme? */
  currentProgramme: Scalars["Boolean"];
};

export type ListUserProgrammesResult = {
  programmes: Array<ListUserProgrammesItem>;
};

export type Location = {
  label: Scalars["String"];
  required: Scalars["Boolean"];
  format: Scalars["String"];
};

export type LogDeliveredSessionInput = {
  /** Advocate's email address */
  userEmail: Scalars["String"];
  /** ID of the delivered session */
  sessionId: Scalars["String"];
  /** ISO-8601, when did delivery begin */
  sessionStart: Scalars["String"];
  /** ISO-8601, when did delivery complete */
  sessionEnd: Scalars["String"];
  /** JSON, the participants who attended */
  participants: Maybe<Scalars["String"]>;
  /** Number of delivered-to participants */
  participantsCount: Maybe<Scalars["Int"]>;
  /**  Any extra JSON data */
  extra: Scalars["String"];
};

export type LogDeliveredSessionResult = {
  /** ID for the delivered session */
  deliveredSessionId: Scalars["ID"];
};

export type Mutation = {
  /** Send an email with a login reminder to link to an advocate */
  sendLoginReminder: SendResult;
  /** Check and consume a login token */
  checkLoginToken: CheckLoginTokenResult;
  /** Log that an advocate has delivered a session to some participants */
  logDeliveredSession: LogDeliveredSessionResult;
  /** Updates the username for an existing user, returning an updated user payload */
  updateUsername: UserOptions;
  /** Tries to gain access to a programme via a secret code */
  checkProgrammeCode: CheckProgrammeCodeResult;
  /** Changes the current programme for a user */
  switchCurrentProgramme: UserOptions;
  /** Returns persistent user options */
  getPersistentUserOptions: GetPersistentUserOptionsResult;
};

export type MutationSendLoginReminderArgs = {
  email: Scalars["String"];
  platform: Maybe<Scalars["String"]>;
};

export type MutationCheckLoginTokenArgs = {
  token: Scalars["String"];
  platform: Maybe<Scalars["String"]>;
};

export type MutationLogDeliveredSessionArgs = {
  input: LogDeliveredSessionInput;
};

export type MutationUpdateUsernameArgs = {
  userEmail: Scalars["String"];
  userName: Scalars["String"];
  platform: Maybe<Scalars["String"]>;
};

export type MutationCheckProgrammeCodeArgs = {
  programmeCode: Scalars["String"];
  userEmail: Scalars["String"];
  platform: Maybe<Scalars["String"]>;
};

export type MutationSwitchCurrentProgrammeArgs = {
  userEmail: Scalars["String"];
  programmeId: Scalars["Int"];
  platform: Maybe<Scalars["String"]>;
};

export type MutationGetPersistentUserOptionsArgs = {
  token: Scalars["String"];
  platform: Maybe<Scalars["String"]>;
};

export type Query = {
  /** Smoke test that the server is working */
  hello: Scalars["String"];
  /** Check minimum version for the app */
  acceptableMinimumVersion: SendIfVersionAccepted;
  /** Gets all the programmes a user is associated with */
  listUserProgrammes: ListUserProgrammesResult;
};

export type QueryAcceptableMinimumVersionArgs = {
  platform: Maybe<AppPlatform>;
  currentVersion: Maybe<Scalars["String"]>;
};

export type QueryListUserProgrammesArgs = {
  userEmail: Maybe<Scalars["String"]>;
};

export type SendIfVersionAccepted = {
  versionAccepted: Scalars["Boolean"];
};

export type SendResult = {
  /** Was the email sent */
  sent: Scalars["Boolean"];
  /** What was the email the API sent to (emails are cleaned up) */
  email: Scalars["String"];
  /** Was this a newly created record -- i.e. a new email address */
  createdInvite: Scalars["Boolean"];
  /** Some users can log-in automatically, if so, these are their details */
  autoLoginUserOptions: Maybe<UserOptions>;
  /** What was the platform used to sign in */
  platform: Scalars["String"];
};

export type Theme = {
  primary: Scalars["String"];
};

export type UserOptions = {
  /** The user's email address */
  email: Scalars["String"];
  /** Unique identifier per user */
  userId: Scalars["String"];
  /** Name of this user */
  userName: Maybe<Scalars["String"]>;
  /** Location of the session/curriculum configuration JSON */
  sessionsConfigUrl: Scalars["String"];
  /** Base URL to use to construct URLs for content */
  baseSessionContentUrl: Scalars["String"];
  /** Feature flags for this user, if null, use default flag value */
  flags: Flags;
  /** The user's app title based on the email address */
  brandingTitle: Scalars["String"];
  /** The user's app title based on the email address */
  theme: Theme;
  /** The ID of the programme the user is currently using */
  programmeId: Scalars["Int"];
  /** Delivery metadata for the programme */
  deliveryMetadata: DeliveryMetadata;
};

import { GraphQLResolveInfo } from "graphql";

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type StitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, TParent, TContext, TArgs>;
}

export type SubscriptionResolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionResolverObject<TResult, TParent, TContext, TArgs>)
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Query: {};
  String: Scalars["String"];
  AppPlatform: AppPlatform;
  SendIfVersionAccepted: SendIfVersionAccepted;
  Boolean: Scalars["Boolean"];
  ListUserProgrammesResult: ListUserProgrammesResult;
  ListUserProgrammesItem: ListUserProgrammesItem;
  Int: Scalars["Int"];
  Mutation: {};
  SendResult: SendResult;
  UserOptions: UserOptions;
  Flags: Flags;
  Theme: Theme;
  DeliveryMetadata: DeliveryMetadata;
  Location: Location;
  CheckLoginTokenResult: CheckLoginTokenResult;
  LogDeliveredSessionInput: LogDeliveredSessionInput;
  LogDeliveredSessionResult: LogDeliveredSessionResult;
  ID: Scalars["ID"];
  CheckProgrammeCodeResult: CheckProgrammeCodeResult;
  GetPersistentUserOptionsResult: GetPersistentUserOptionsResult;
};

export type CheckLoginTokenResultResolvers<ContextType = any, ParentType = ResolversTypes["CheckLoginTokenResult"]> = {
  valid: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  userOptions: Resolver<Maybe<ResolversTypes["UserOptions"]>, ParentType, ContextType>;
  persistentUserToken: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
};

export type CheckProgrammeCodeResultResolvers<
  ContextType = any,
  ParentType = ResolversTypes["CheckProgrammeCodeResult"]
> = {
  valid: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  userOptions: Resolver<Maybe<ResolversTypes["UserOptions"]>, ParentType, ContextType>;
};

export type DeliveryMetadataResolvers<ContextType = any, ParentType = ResolversTypes["DeliveryMetadata"]> = {
  location: Resolver<Maybe<ResolversTypes["Location"]>, ParentType, ContextType>;
};

export type FlagsResolvers<ContextType = any, ParentType = ResolversTypes["Flags"]> = {
  notes: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>;
  print: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>;
  download: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>;
  flash: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>;
  participants: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>;
  attributes: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>;
  participantsWheel: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>;
};

export type GetPersistentUserOptionsResultResolvers<
  ContextType = any,
  ParentType = ResolversTypes["GetPersistentUserOptionsResult"]
> = {
  userOptions: Resolver<Maybe<ResolversTypes["UserOptions"]>, ParentType, ContextType>;
};

export type ListUserProgrammesItemResolvers<
  ContextType = any,
  ParentType = ResolversTypes["ListUserProgrammesItem"]
> = {
  brandingTitle: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  programmeId: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  currentProgramme: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
};

export type ListUserProgrammesResultResolvers<
  ContextType = any,
  ParentType = ResolversTypes["ListUserProgrammesResult"]
> = {
  programmes: Resolver<Array<ResolversTypes["ListUserProgrammesItem"]>, ParentType, ContextType>;
};

export type LocationResolvers<ContextType = any, ParentType = ResolversTypes["Location"]> = {
  label: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  required: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  format: Resolver<ResolversTypes["String"], ParentType, ContextType>;
};

export type LogDeliveredSessionResultResolvers<
  ContextType = any,
  ParentType = ResolversTypes["LogDeliveredSessionResult"]
> = {
  deliveredSessionId: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType = ResolversTypes["Mutation"]> = {
  sendLoginReminder: Resolver<ResolversTypes["SendResult"], ParentType, ContextType, MutationSendLoginReminderArgs>;
  checkLoginToken: Resolver<
    ResolversTypes["CheckLoginTokenResult"],
    ParentType,
    ContextType,
    MutationCheckLoginTokenArgs
  >;
  logDeliveredSession: Resolver<
    ResolversTypes["LogDeliveredSessionResult"],
    ParentType,
    ContextType,
    MutationLogDeliveredSessionArgs
  >;
  updateUsername: Resolver<ResolversTypes["UserOptions"], ParentType, ContextType, MutationUpdateUsernameArgs>;
  checkProgrammeCode: Resolver<
    ResolversTypes["CheckProgrammeCodeResult"],
    ParentType,
    ContextType,
    MutationCheckProgrammeCodeArgs
  >;
  switchCurrentProgramme: Resolver<
    ResolversTypes["UserOptions"],
    ParentType,
    ContextType,
    MutationSwitchCurrentProgrammeArgs
  >;
  getPersistentUserOptions: Resolver<
    ResolversTypes["GetPersistentUserOptionsResult"],
    ParentType,
    ContextType,
    MutationGetPersistentUserOptionsArgs
  >;
};

export type QueryResolvers<ContextType = any, ParentType = ResolversTypes["Query"]> = {
  hello: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  acceptableMinimumVersion: Resolver<
    ResolversTypes["SendIfVersionAccepted"],
    ParentType,
    ContextType,
    QueryAcceptableMinimumVersionArgs
  >;
  listUserProgrammes: Resolver<
    ResolversTypes["ListUserProgrammesResult"],
    ParentType,
    ContextType,
    QueryListUserProgrammesArgs
  >;
};

export type SendIfVersionAcceptedResolvers<ContextType = any, ParentType = ResolversTypes["SendIfVersionAccepted"]> = {
  versionAccepted: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
};

export type SendResultResolvers<ContextType = any, ParentType = ResolversTypes["SendResult"]> = {
  sent: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  email: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  createdInvite: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  autoLoginUserOptions: Resolver<Maybe<ResolversTypes["UserOptions"]>, ParentType, ContextType>;
  platform: Resolver<ResolversTypes["String"], ParentType, ContextType>;
};

export type ThemeResolvers<ContextType = any, ParentType = ResolversTypes["Theme"]> = {
  primary: Resolver<ResolversTypes["String"], ParentType, ContextType>;
};

export type UserOptionsResolvers<ContextType = any, ParentType = ResolversTypes["UserOptions"]> = {
  email: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  userId: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  userName: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  sessionsConfigUrl: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  baseSessionContentUrl: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  flags: Resolver<ResolversTypes["Flags"], ParentType, ContextType>;
  brandingTitle: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  theme: Resolver<ResolversTypes["Theme"], ParentType, ContextType>;
  programmeId: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  deliveryMetadata: Resolver<ResolversTypes["DeliveryMetadata"], ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  CheckLoginTokenResult: CheckLoginTokenResultResolvers<ContextType>;
  CheckProgrammeCodeResult: CheckProgrammeCodeResultResolvers<ContextType>;
  DeliveryMetadata: DeliveryMetadataResolvers<ContextType>;
  Flags: FlagsResolvers<ContextType>;
  GetPersistentUserOptionsResult: GetPersistentUserOptionsResultResolvers<ContextType>;
  ListUserProgrammesItem: ListUserProgrammesItemResolvers<ContextType>;
  ListUserProgrammesResult: ListUserProgrammesResultResolvers<ContextType>;
  Location: LocationResolvers<ContextType>;
  LogDeliveredSessionResult: LogDeliveredSessionResultResolvers<ContextType>;
  Mutation: MutationResolvers<ContextType>;
  Query: QueryResolvers<ContextType>;
  SendIfVersionAccepted: SendIfVersionAcceptedResolvers<ContextType>;
  SendResult: SendResultResolvers<ContextType>;
  Theme: ThemeResolvers<ContextType>;
  UserOptions: UserOptionsResolvers<ContextType>;
};

/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = any> = Resolvers<ContextType>;
