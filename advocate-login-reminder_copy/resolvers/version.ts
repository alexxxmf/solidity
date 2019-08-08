import { dynamoDb } from "../config";
import { QueryResolvers, Maybe, AppPlatform } from "../generated/types";
import * as compareVersions from "compare-versions";

const lookupMinimumVersions = async (platform: AppPlatform): Promise<Maybe<string>> => {
  return new Promise((resolve, reject) => {
    dynamoDb.get(
      {
        TableName: process.env.DYNAMODB_MINIMUM_VERSIONS_TABLE,
        Key: { platform: platform }
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (!result.Item) {
          resolve(null);
        } else {
          resolve(result.Item.minimumVersion);
        }
      }
    );
  });
};

export const checkIfVersionIsAcceptable: QueryResolvers["acceptableMinimumVersion"] = async (
  _,
  { currentVersion, platform }
): Promise<{ versionAccepted: boolean }> => {
  const minimumVersion = await lookupMinimumVersions(platform);

  if (!minimumVersion) {
    return { versionAccepted: true };
  }

  const comparisonResult = compareVersions(currentVersion, minimumVersion);
  return {
    versionAccepted: comparisonResult !== -1
  };
};
