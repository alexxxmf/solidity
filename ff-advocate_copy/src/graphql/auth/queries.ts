import gql from "graphql-tag";

export enum AppPlatform {
  ios,
  android
}

export const CHECK_MINIMUM_VERSION = gql`
  query appMinimumVersion($platform: AppPlatform, $currentVersion: String) {
    acceptableMinimumVersion(
      platform: $platform
      currentVersion: $currentVersion
    ) {
      versionAccepted
    }
  }
`;

export interface CheckMinVersionVars {
  platform: AppPlatform;
  currentVersion: string;
}

export interface CheckMinVersionResult {
  acceptableMinimumVersion: {
    versionAccepted: boolean;
  };
}

export const LIST_USER_PROGRAMMES = gql`
  query listUserProgrammes($userEmail: String!) {
    listUserProgrammes(userEmail: $userEmail) {
      programmes {
        programmeId
        brandingTitle
        currentProgramme
      }
    }
  }
`;

export interface ListUserProgrammesVars {
  userEmail: string;
}

export interface ListUserProgrammesItem {
  programmeId: number;
  brandingTitle: string;
  currentProgramme: boolean;
}

export interface ListUserProgrammesResult {
  listUserProgrammes: {
    programmes: ListUserProgrammesItem[];
  };
}
