import { ApolloServer, makeExecutableSchema } from "apollo-server-lambda";
import { dynamoDb, mandrillClient } from "./config";
import * as uuid from "uuid";
import typeDefs from "./schema.graphql";
import {
  MutationResolvers,
  SendResult,
  CheckLoginTokenResult,
  Maybe,
  UserOptions,
  QueryResolvers,
  ListUserProgrammesResult,
  Resolvers,
  GetPersistentUserOptionsResult,
  CheckProgrammeCodeResult
} from "./generated/types";
import { checkIfVersionIsAcceptable } from "./resolvers/version";
import { helloResolver } from "./resolvers/hello";
import { logDeliveredSession } from "./resolvers/analytics";
import * as lodash from "lodash";
import * as Rollbar from "rollbar";

interface UserInviteEntry {
  welcomeLink: string;
  email: string;
  userId: string;
  userName: Maybe<string>;
  platform: string;
}

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
type ProgrammeData = Omit<UserOptions, "email" | "userId" | "userName">;

const FF_PROGRAMME_ID = 111111;
const HMCTS_PROGRAMME_ID = 153466;

const normaliseEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

const assignUserId = async (email: string, userId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const params = {
      TableName: process.env.DYNAMODB_INVITED_USERS_TABLE,
      Key: { email },
      UpdateExpression: "SET userId = :u",
      ExpressionAttributeValues: {
        ":u": userId
      }
    };

    dynamoDb.update(params, async error => {
      if (error) {
        reject(error);
      } else {
        resolve(userId);
      }
    });
  });
};

const assignUserPlatform = async (email: string, platform: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const params = {
      TableName: process.env.DYNAMODB_INVITED_USERS_TABLE,
      Key: { email },
      UpdateExpression: "SET platform = :u",
      ExpressionAttributeValues: {
        ":u": platform
      }
    };

    dynamoDb.update(params, async error => {
      if (error) {
        reject(error);
      } else {
        resolve(platform);
      }
    });
  });
};

const setUsernameForUser = async (email: string, userName: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const params = {
      TableName: process.env.DYNAMODB_INVITED_USERS_TABLE,
      Key: { email },
      UpdateExpression: "SET userName = :u",
      ExpressionAttributeValues: {
        ":u": userName
      }
    };

    dynamoDb.update(params, async error => {
      if (error) {
        reject(error);
      } else {
        resolve(userName);
      }
    });
  });
};

const lookupInviteEmail = async (cleanEmail: string, platform: string): Promise<Maybe<UserInviteEntry>> => {
  const tableName =
    platform === "mentor" ? process.env.DYNAMODB_INVITED_USERS_TABLE : process.env.DYNAMODB_SEEKER_INVITED_USERS_TABLE;
  return new Promise((resolve, reject) => {
    dynamoDb.get(
      {
        TableName: tableName,
        Key: { email: cleanEmail }
      },
      async (error, result) => {
        if (error) {
          reject(error);
        } else if (!result.Item) {
          resolve(null);
        } else {
          if (!result.Item.userId) {
            const userId = uuid.v4();

            await assignUserId(cleanEmail, userId);

            result.Item.userId = userId;
          }
          if (!result.Item.platform) {
            await assignUserPlatform(cleanEmail, platform);
            result.Item.platform = platform;
          }
          resolve(result.Item as UserInviteEntry);
        }
      }
    );
  });
};

const createDefaultUserInvite = async (cleanEmail: string, platform: string): Promise<UserInviteEntry> => {
  const dbItem =
    platform === "mentor"
      ? {
          email: cleanEmail,
          userId: uuid.v4(),
          welcomeLink: `digitalmentor://user/${cleanEmail}`,
          welcomePayload: `user/${cleanEmail}`,
          userName: null as Maybe<string>,
          platform: "mentor"
        }
      : {
          email: cleanEmail,
          userId: uuid.v4(),
          welcomeLink: `seeker://user/${cleanEmail}`,
          welcomePayload: `user/${cleanEmail}`,
          userName: null as Maybe<string>,
          platform: "seeker"
        };
  const tableName =
    platform === "mentor" ? process.env.DYNAMODB_INVITED_USERS_TABLE : process.env.DYNAMODB_SEEKER_INVITED_USERS_TABLE;
  return new Promise((resolve, reject) => {
    dynamoDb.put(
      {
        TableName: tableName,
        Item: dbItem
      },
      error => {
        if (error) {
          reject(error);
        }

        resolve(dbItem);
      }
    );
  });
};

const createLoginToken = async (cleanEmail: string, platform: string): Promise<string> => {
  const token = uuid.v4();
  const dbItem = {
    email: cleanEmail,
    token,
    platform: platform
  };

  return new Promise((resolve, reject) => {
    dynamoDb.put(
      {
        TableName: process.env.DYNAMODB_LOGIN_TOKENS_TABLE,
        Item: dbItem
      },
      error => {
        if (error) {
          reject(error);
        }
        resolve(token);
      }
    );
  });
};

const getLoginTokenEmail = async (token: string): Promise<Maybe<string>> => {
  return new Promise((resolve, reject) => {
    dynamoDb.get(
      {
        TableName: process.env.DYNAMODB_LOGIN_TOKENS_TABLE,
        Key: { token }
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (!result.Item) {
          resolve(null);
        } else {
          resolve(result.Item.email as string);
        }
      }
    );
  });
};

// Deprecated way to check HMTCS clients
// Will be removed in the next deploy
const checkIfhmctsEmail = async (email: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const params = {
      TableName: process.env.DYNAMODB_HMCTS_USERS_TABLE,
      Key: { email }
    };

    console.log("TCL: params", params);
    dynamoDb.get(params, (error, result) => {
      if (error) {
        reject(error);
      } else if (!result.Item) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};

const removeFromHmctsList = async (email: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const params = {
      TableName: process.env.DYNAMODB_HMCTS_USERS_TABLE,
      Key: { email }
    };

    dynamoDb.delete(params, error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

const listMembershipsInOrder = async (
  userEmail: string
): Promise<{ userEmail: string; programmeId: number; usedAt: string; usedAtDate: Date }[]> => {
  // Orders memberships by `usedAt` descending for the given email address. Returns most recent programme ID, or null if no memberships
  return new Promise((resolve, reject) => {
    const params = {
      TableName: process.env.DYNAMODB_MEMBERSHIPS_TABLE,
      KeyConditionExpression: "userEmail = :userEmail",
      ExpressionAttributeValues: {
        ":userEmail": userEmail
      }
    };

    dynamoDb.query(params, (error, result) => {
      if (error) {
        reject(error);
      } else if (!result.Items) {
        resolve(null);
      } else {
        const items: {
          userEmail: string;
          programmeId: number;
          usedAt: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }[] = result.Items as any;

        const withDates = lodash.map(items, item => ({
          ...item,
          usedAtDate: new Date(item.usedAt)
        }));

        const descending = lodash.orderBy(withDates, ["usedAtDate"], ["desc"]);

        if (descending.length === 0) {
          resolve([]);
        } else {
          resolve(descending);
        }
      }
    });
  });
};

const lookupRecentProgrammeIdMembership = async (userEmail: string): Promise<Maybe<number>> => {
  const memberships = await listMembershipsInOrder(userEmail);

  if (memberships.length === 0) {
    return null;
  } else {
    return memberships[0].programmeId;
  }
};

const isUserMemberOfProgramme = async (userEmail: string, programmeId: number): Promise<boolean> => {
  const memberships = await listMembershipsInOrder(userEmail);
  const filtered = lodash.filter(memberships, membership => membership.programmeId === programmeId);
  return filtered.length > 0;
};

const getProgrammeDataById = async (programmeId: number): Promise<ProgrammeData> => {
  return new Promise((resolve, reject) => {
    const params = {
      TableName: process.env.DYNAMODB_PROGRAMMES_DATA_TABLE,
      Key: { programmeId }
    };
    dynamoDb.get(params, (error, result) => {
      if (error) {
        reject(error);
        console.log("Error", error);
      } else if (!result.Item && programmeId === HMCTS_PROGRAMME_ID) {
        console.log("Programme ID not found", programmeId);
        const hmctsDbItem: ProgrammeData = {
          programmeId: programmeId,
          sessionsConfigUrl: "https://content.freeformers.com/advocate/hmcts/sessions/courses.json",
          baseSessionContentUrl: "https://content.freeformers.com",
          flags: {
            notes: null,
            print: null,
            download: null,
            flash: null,
            participants: null,
            attributes: null,
            participantsWheel: null
          },
          brandingTitle: "Digital You HMCTS",
          theme: {
            primary: "#032D5A"
          },
          deliveryMetadata: {
            location: null
          }
        };
        dynamoDb.put(
          {
            TableName: process.env.DYNAMODB_PROGRAMMES_DATA_TABLE,
            Item: hmctsDbItem
          },
          error => {
            if (error) {
              reject(error);
            }
            resolve(hmctsDbItem);
          }
        );
        console.log("Programme table updated", hmctsDbItem);
      } else if (!result.Item && programmeId === FF_PROGRAMME_ID) {
        console.log("Programme ID not found", programmeId);
        const ffDbItem: ProgrammeData = {
          programmeId: programmeId,
          sessionsConfigUrl: "https://content.freeformers.com/advocate/config/sessions.json",
          baseSessionContentUrl: "https://content.freeformers.com/advocate/sessions",
          flags: {
            notes: null,
            print: null,
            download: null,
            flash: null,
            participants: null,
            attributes: null,
            participantsWheel: null
          },
          brandingTitle: "Digital Mentor",
          theme: {
            primary: "#3A4158"
          },
          deliveryMetadata: {
            location: null
          }
        };
        dynamoDb.put(
          {
            TableName: process.env.DYNAMODB_PROGRAMMES_DATA_TABLE,
            Item: ffDbItem
          },
          error => {
            if (error) {
              reject(error);
            }
            resolve(ffDbItem);
          }
        );
        console.log("Programme table updated", ffDbItem);
      } else if (!result.Item) {
        console.log("Programme not found");
        resolve(null);
      } else {
        resolve(result.Item as ProgrammeData);
        console.log("Programme found", result.Item);
      }
    });
  });
};

const addMembershipForProgrammeId = async (email: string, programmeId: number): Promise<number> => {
  // Does an upsert per email and programme ID, always setting `usedAt` to now.
  return new Promise((resolve, reject) => {
    const now = new Date();
    const params = {
      TableName: process.env.DYNAMODB_MEMBERSHIPS_TABLE,
      Item: {
        userEmail: email,
        programmeId: programmeId,
        usedAt: now.toISOString()
      }
    };

    dynamoDb.put(params, async error => {
      if (error) {
        reject(error);
      }

      const updateParams = {
        TableName: process.env.DYNAMODB_MEMBERSHIPS_TABLE,
        Key: { userEmail: email, programmeId: programmeId },
        UpdateExpression: "SET usedAt = :u",
        ExpressionAttributeValues: {
          ":u": now.toISOString()
        }
      };

      dynamoDb.update(updateParams, async error => {
        if (error) {
          reject(error);
        } else {
          resolve(programmeId);
        }
      });
    });
  });
};

const getProgrammeIdByEmail = async (emailMatch: string): Promise<Maybe<number>> => {
  const params = {
    TableName: process.env.DYNAMODB_PROGRAMMES_MATCHING_TABLE
  };

  return new Promise((resolve, reject) => {
    dynamoDb.scan(params, (error, result) => {
      if (error) {
        reject(error);
      } else if (!result.Items) {
        resolve(null);
      } else {
        for (const pattern of result.Items) {
          const foundPattern = !!emailMatch.match(pattern.emailMatch);
          if (foundPattern === true) {
            resolve(pattern.programmeId);
            break;
          }
        }
        resolve(null);
      }
    });
  });
};

const getProgrammeIdByProgrammeCode = async (programmeCode: string): Promise<Maybe<number>> => {
  return new Promise((resolve, reject) => {
    const params = {
      TableName: process.env.DYNAMODB_PROGRAMMES_CODES_TABLE,
      Key: { programmeCode }
    };
    dynamoDb.get(params, (error, result) => {
      if (error) {
        reject(error);
      } else if (!result.Item) {
        resolve(null);
      } else {
        resolve(result.Item.programmeId as number);
      }
    });
  });
};

const getUserOptionsForEmail = async (
  email: string,
  platform: string,
  programmeIdToJoin?: number
): Promise<UserOptions> => {
  const user = await lookupInviteEmail(email, platform);

  let mostRecentProgrammeId: Maybe<number> = await lookupRecentProgrammeIdMembership(email);
  let programmeData: Maybe<ProgrammeData> = null;

  if (mostRecentProgrammeId) {
    const matchedProgrammeId = await getProgrammeIdByEmail(email);

    if (matchedProgrammeId) {
      const alreadyMember = await isUserMemberOfProgramme(email, matchedProgrammeId);
      if (!alreadyMember) {
        mostRecentProgrammeId = await addMembershipForProgrammeId(email, matchedProgrammeId);
      }
    }
    programmeData = await getProgrammeDataById(mostRecentProgrammeId);
  } else {
    // All users are always in the FF programme by default
    mostRecentProgrammeId = await addMembershipForProgrammeId(email, FF_PROGRAMME_ID);

    // ... and now check by domain
    const matchedProgrammeId = await getProgrammeIdByEmail(email);

    if (matchedProgrammeId) {
      const alreadyMember = await isUserMemberOfProgramme(email, matchedProgrammeId);
      if (!alreadyMember) {
        mostRecentProgrammeId = await addMembershipForProgrammeId(email, matchedProgrammeId);
      }
    }
    programmeData = await getProgrammeDataById(mostRecentProgrammeId);
  }

  // To be deprecated on next release
  const hmctsFound = await checkIfhmctsEmail(email);
  if (hmctsFound) {
    const alreadyHmctsMember = await isUserMemberOfProgramme(email, HMCTS_PROGRAMME_ID);
    if (!alreadyHmctsMember) {
      mostRecentProgrammeId = await addMembershipForProgrammeId(email, HMCTS_PROGRAMME_ID);
      programmeData = await getProgrammeDataById(mostRecentProgrammeId);
    }
    await removeFromHmctsList(email);
  }

  // Join the provided programme
  if (programmeIdToJoin) {
    mostRecentProgrammeId = await addMembershipForProgrammeId(email, programmeIdToJoin);
    programmeData = await getProgrammeDataById(mostRecentProgrammeId);
  }

  const userData = {
    email,
    userId: user.userId,
    userName: user.userName
  };

  console.log("TCL: userData", userData);
  console.log("TCL: programmeData", programmeData);

  return {
    ...userData,
    ...programmeData
  };
};

interface MandrillResult {
  status: string;
}

const resendWelcomeEmail = async (
  email: string,
  welcomeLink: string,
  token: string,
  platform: string
): Promise<[MandrillResult]> => {
  return new Promise((resolve, reject) => {
    mandrillClient.messages.sendTemplate(
      {
        template_name: platform === "mentor" ? "advocate-welcome-link-en" : "seeker-welcome-link-en",
        template_content: [],
        message: {
          to: [
            {
              email
            }
          ],
          merge: true,
          merge_language: "mailchimp",
          global_merge_vars: [
            {
              name: "welcome_link",
              content: welcomeLink
            },
            {
              name: "login_token",
              content: token
            }
          ]
        },
        async: true
      },
      resolve,
      reject
    );
  });
};

interface ConnectionContext {}

const sendLoginReminder: MutationResolvers["sendLoginReminder"] = async (
  _,
  { email, platform }
): Promise<SendResult> => {
  const cleanEmail = normaliseEmail(email);
  console.log("TCL: sendLoginReminder.email", email);
  console.log("TCL: sendLoginReminder.cleanEmail", cleanEmail);

  const platformUsed = platform || "mentor";

  const fail: SendResult = {
    sent: false,
    email: cleanEmail,
    createdInvite: false,
    autoLoginUserOptions: null,
    platform: platformUsed
  };
  let createdInvite = false;

  let dbItem = await lookupInviteEmail(cleanEmail, platformUsed);

  if (!dbItem) {
    // If a user has not logged-in before, create a record for them
    dbItem = await createDefaultUserInvite(cleanEmail, platformUsed);
    createdInvite = true;
  }

  const { welcomeLink } = dbItem;

  if (!welcomeLink) {
    return fail;
  }

  const token = await createLoginToken(cleanEmail, platformUsed);

  const mandrillRes = await resendWelcomeEmail(cleanEmail, welcomeLink, token, platformUsed);

  const { status } = mandrillRes[0];
  if (status !== "sent" && status !== "queued") {
    return fail;
  }

  // TODO support providing this for staff, when a flag enabled
  let autoLoginUserOptions = null;

  console.log(`Token: ${token}`);

  const res: SendResult = {
    sent: true,
    email: cleanEmail,
    createdInvite,
    autoLoginUserOptions,
    platform: platformUsed
  };
  console.log("TCL: sendLoginReminder.res", res);

  return res;
};

const createPersistentUserToken = async (email: string, token: string): Promise<string> => {
  const dbItem = {
    token: token,
    email: email
  };

  return new Promise((resolve, reject) => {
    dynamoDb.put(
      {
        TableName: process.env.DYNAMODB_PERSISTENT_USER_TOKENS_TABLE,
        Item: dbItem
      },
      error => {
        if (error) {
          reject(error);
        }
        resolve(token);
      }
    );
  });
};

const checkLoginToken: MutationResolvers["checkLoginToken"] = async (
  _,
  { token, platform }
): Promise<CheckLoginTokenResult> => {
  console.log("TCL: checkLoginToken.token", token);

  const platformUsed = platform || "mentor";
  console.log("TCL: checkLoginToken.platformUsed", platformUsed);

  if (!token) {
    return { valid: false, userOptions: null, persistentUserToken: null };
  }

  const email = await getLoginTokenEmail(token);
  console.log("TCL: checkLoginToken.email", email);

  if (!email) {
    return { valid: false, userOptions: null, persistentUserToken: null };
  }

  const userOptions = await getUserOptionsForEmail(email, platformUsed);
  console.log("TCL: checkLoginToken.userOptions", userOptions);

  const newToken = uuid.v4();

  const createdPersistentUserToken = await createPersistentUserToken(email, newToken);

  // TODO invalidate consumed tokens

  const res = {
    valid: true,
    userOptions,
    persistentUserToken: createdPersistentUserToken
  };
  console.log("TCL: checkLoginToken.res", res);
  return res;
};

const updateUsername: MutationResolvers["updateUsername"] = async (
  _,
  { userEmail: dirtyEmail, userName, platform }
): Promise<UserOptions> => {
  const userEmail = normaliseEmail(dirtyEmail);

  await setUsernameForUser(userEmail, userName);

  const userPlatform = platform || "mentor";

  const userOptions = await getUserOptionsForEmail(userEmail, userPlatform);

  return userOptions;
};

const listUserProgrammes: QueryResolvers["listUserProgrammes"] = async (
  _,
  { userEmail: dirtyEmail }
): Promise<ListUserProgrammesResult> => {
  if (!dirtyEmail) {
    return { programmes: [] };
  }
  const userEmail = normaliseEmail(dirtyEmail);
  const userMemberships = await listMembershipsInOrder(userEmail);

  const userProgrammes = await Promise.all(
    userMemberships.map(async (userMembership: { userEmail: string; programmeId: number; usedAt: string }, i) => {
      const programmeData = await getProgrammeDataById(userMembership.programmeId);
      if (programmeData) {
        return {
          brandingTitle: programmeData.brandingTitle,
          programmeId: userMembership.programmeId,
          currentProgramme: i === 0
        };
      }
    })
  );

  if (userProgrammes) {
    return { programmes: lodash.compact(userProgrammes) };
  } else {
    return { programmes: [] };
  }
};

const switchCurrentProgramme: MutationResolvers["switchCurrentProgramme"] = async (
  _,
  { userEmail: dirtyEmail, programmeId, platform }
): Promise<Maybe<UserOptions>> => {
  const userEmail = normaliseEmail(dirtyEmail);

  const params = {
    TableName: process.env.DYNAMODB_MEMBERSHIPS_TABLE,
    Key: { userEmail, programmeId }
  };

  const userPlatform = platform || "mentor";

  return new Promise((resolve, reject) => {
    dynamoDb.get(params, async (error, result) => {
      if (error) {
        reject(error);
      } else if (!result.Item) {
        reject(new Error("User not a member of programme"));
      } else {
        // Get user options and set programme ID as most recently used
        const userOptions = await getUserOptionsForEmail(userEmail, userPlatform, programmeId);
        resolve(userOptions);
      }
    });
  });
};

const checkProgrammeCode: MutationResolvers["checkProgrammeCode"] = async (
  _,
  { programmeCode, userEmail: dirtyEmail, platform }
): Promise<CheckProgrammeCodeResult> => {
  const userEmail = normaliseEmail(dirtyEmail);

  const programmeId = await getProgrammeIdByProgrammeCode(programmeCode);

  const userPlatform = platform || "mentor";

  if (!programmeId) {
    return {
      valid: false,
      userOptions: null
    };
  }

  const userOptions = await getUserOptionsForEmail(userEmail, userPlatform, programmeId);

  return {
    valid: true,
    userOptions
  };
};

const getPersistentUserTokenEmail = async (token: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    dynamoDb.get(
      {
        TableName: process.env.DYNAMODB_PERSISTENT_USER_TOKENS_TABLE,
        Key: { token: token }
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.Item.email);
        }
      }
    );
  });
};

const getPersistentUserOptions: MutationResolvers["getPersistentUserOptions"] = async (
  _,
  { token, platform }
): Promise<GetPersistentUserOptionsResult> => {
  console.log("TCL: getPersistentUserOptions.token", token);

  if (!token) {
    return { userOptions: null };
  }

  const email = await getPersistentUserTokenEmail(token);
  console.log("TCL: getPersistentUserOptions.email", email);

  if (!email) {
    return { userOptions: null };
  }

  const userPlatform = platform || "mentor";

  const userOptions = await getUserOptionsForEmail(email, userPlatform);
  console.log("TCL: getPersistentUserOptions.userOptions", userOptions);

  const res = {
    userOptions
  };

  console.log("TCL: getPersistentUserOptions.res", res);
  return res;
};

const resolvers: Pick<Resolvers, "Query" | "Mutation"> = {
  Query: {
    hello: helloResolver,
    acceptableMinimumVersion: checkIfVersionIsAcceptable,
    listUserProgrammes
  },
  Mutation: {
    sendLoginReminder,
    checkLoginToken,
    logDeliveredSession,
    updateUsername,
    checkProgrammeCode,
    switchCurrentProgramme,
    getPersistentUserOptions
  }
};

const schema = makeExecutableSchema<ConnectionContext>({ typeDefs, resolvers });

const rollbarConfig: Rollbar.Configuration = {
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN || "",
  captureIp: "anonymize",
  environment: process.env.ROLLBAR_ENVIRONMENT || "testing"
};

const rollbar = new Rollbar(rollbarConfig);

const server = new ApolloServer({
  schema,
  introspection: true,
  formatError: (error: Error) => {
    rollbar.error(error, { error });
    return error;
  }
});

const apolloLambdaHandler = server.createHandler({
  cors: {
    origin: true,
    credentials: true
  }
});

export const graphql = rollbar.lambdaHandler(apolloLambdaHandler);
