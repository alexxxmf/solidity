import React, { Component } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ImageSourcePropType,
  SectionList,
  SectionListData
} from "react-native";
import _ from "lodash";
import styled from "styled-components/native";
import { Colors, Metrics, Fonts } from "../../themes";
import { NavigationInjectedProps, withNavigation } from "react-navigation";
import FaIcon from "react-native-vector-icons/FontAwesome5";
import ListStyle from "../styles/ListStyle";
import { Card } from "../styles/CardStyle";
import { ErrorText } from "../styles/FormStyle";
import topicImages from "../../themes/Images";
import Button from "./Button";
import { AppScreenProps } from "../../types";
import { SessionDetailsScreenParams } from "../SessionDetailsScreen";
import { logger } from "../../utils/logging";
import { navigateToParticipantsRegisterScreen } from "../../navigation/HomeNavigation";
import { UrlWebviewScreenParams } from "../UrlWebviewScreen";

const POLLLING_INTERVAL = 300000;

// The group object from adapt tools has in data property a list of sessionIds
interface GroupInput {
  title: string;
  sessionIds: string[];
  sectionIcon?: keyof typeof topicImages;
}

interface GroupOutput extends SectionListData<SessionEntry> {
  title: string;
  data: SessionEntry[];
  sectionIcon?: keyof typeof topicImages;
}

type Props = {
  screenProps: AppScreenProps;
  advocateMode: "Prepare" | "Deliver";
} & NavigationInjectedProps<{}>;

// e.g. https://content.freeformers.com/advocate/config/sessions.json
interface LegacySession {
  id: keyof typeof topicImages;
  title: string;
  session_name: string;
  description: string;
  url_friendly_name: string;
  contentId?: string;
}

// e.g. https://content.freeformers.com/advocate/seeker/sessions/topics.json
interface Session {
  id: string;
  title: string;
  session_name: string;
  description: string;
  graphic?: keyof typeof topicImages;
  graphicUrl?: string;
  contentId: string;
  practice: {
    components: {
      title: string;
      url: string;
    }[];
    title: string;
  };
  delivery: {
    components: {
      title: string;
      url: string;
    }[];
    title: string;
  };
}

type SessionEntry = Session | LegacySession;

function isModernEntry(session: LegacySession | Session): session is Session {
  return (session as Session).contentId !== undefined;
}

type LegacySessionPayload = LegacySession[];

// e.g. https://content.freeformers.com/advocate/tesco/sessions/config.json
interface SessionPayload {
  version: string;
  title: string;
  name: string;
  language: string;
  sessions: Session[];
  groups: GroupInput[];
}

function isModernPayload(
  data: LegacySessionPayload | SessionPayload
): data is SessionPayload {
  return (data as SessionPayload).version !== undefined;
}

interface State {
  isInitiallyLoading: boolean;
  loadingItems: number[];
  sessionsList: SessionEntry[] | null;
  errorMessage: Error["stack"] | null;
  isFetching: boolean;
  groups: GroupOutput[];
  configName: string;
}

function getSessionIcon(session: Session): ImageSourcePropType {
  if (session.graphic) {
    return topicImages[session.graphic];
  } else if (session.graphicUrl) {
    return { uri: session.graphicUrl };
  } else {
    return topicImages.A1;
  }
}

class TopicsList extends Component<Props, State> {
  lastTimeOutRef: NodeJS.Timeout | null;

  constructor(props: Props) {
    super(props);

    this.lastTimeOutRef = null;

    this.state = {
      isInitiallyLoading: true,
      loadingItems: [1, 2, 3, 4, 5, 6],
      sessionsList: null,
      errorMessage: null,
      isFetching: false,
      groups: [],
      configName: ""
    };
  }

  _renderLoadingItem = ({ item }: { item: number }) => {
    return (
      <Card style={styles.card} key={item}>
        <Text style={[styles.dateText, styles.emptyText]}>Loading…</Text>
        <Text style={styles.titleText} />
        <Text style={[styles.dateText, styles.emptyText]}>Loading…</Text>
      </Card>
    );
  };

  _renderItem = (session: SessionEntry) => {
    const sessionIconSource: ImageSourcePropType = isModernEntry(session)
      ? getSessionIcon(session)
      : topicImages[session.id];

    const sessionDetailsNavParams: SessionDetailsScreenParams = isModernEntry(
      session
    )
      ? {
          contentId: session.contentId,
          model: session.title,
          sessionTitle: session.title,
          sessionDescription: session.description,
          sessionIconSource: sessionIconSource,
          globalId: session.id,
          practice: session.practice.components,
          delivery: session.delivery.components,
          configName: this.state.configName
        }
      : {
          contentId: session.id,
          model: session.url_friendly_name,
          sessionTitle: session.title,
          sessionDescription: session.description,
          sessionIconSource: sessionIconSource,
          globalId: session.id,
          practice: null,
          delivery: null,
          configName: this.state.configName
        };
    return (
      <TouchableOpacity
        onPress={() => {
          logger.debug(
            "Launching SessionDetailsScreen",
            sessionDetailsNavParams
          );
          if (isModernEntry(session) && this.props.advocateMode === "Deliver") {
            const params: UrlWebviewScreenParams = {
              uri: session.delivery.components[0].url,
              session: session.title,
              advocateMode: this.props.advocateMode,
              sessionContentId: session.contentId,
              sessionGlobalId: session.id,
              deliveryLocation: null,
              componentTitle: session.delivery.components[0].title,
              configName: this.state.configName,
              participantsCount: null,
              prepareDelivery: null
            };
            navigateToParticipantsRegisterScreen(this.props.navigation, params);
          } else {
            this.props.navigation.navigate(
              `SessionDetailsScreen`,
              sessionDetailsNavParams
            );
          }
        }}
      >
        <Card>
          <View style={styles.cardHeader}>
            <Image
              source={sessionIconSource}
              style={styles.iconImage}
              resizeMode="contain"
            />
            <View style={styles.cardTitle}>
              <Text style={styles.dateText}>{session.session_name}</Text>
              <Text style={styles.titleText}>{session.title}</Text>
            </View>
            <FaIcon
              name="angle-double-right"
              size={Metrics.icons.small}
              style={ListStyle.nextIcon}
            />
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  _createGroups = (
    groups: GroupInput[] | null,
    sessionsList: SessionEntry[]
  ): GroupOutput[] => {
    if (!groups) {
      return [{ title: "", data: sessionsList }];
    }

    const list = groups.map(group => {
      const groupChunk = group.sessionIds.map(sessionId => {
        for (let i = 0; i < sessionsList.length; i++) {
          if (sessionsList[i].contentId === sessionId) {
            return sessionsList[i];
          }
        }
      });

      return {
        data: _.compact(groupChunk),
        title: group.title,
        sectionIcon: group.sectionIcon
      };
    });

    return list;
  };

  _fetchContent = async (
    sessionsUri: string
  ): Promise<{
    sessions: SessionEntry[] | null;
    error: Error["stack"] | null;
    groups: GroupOutput[];
    configName: string;
  }> => {
    // RN fetch implementation is missing some of the common properties from fetch
    const myHeaders = new Headers();
    myHeaders.set("Cache-Control", "no-cache");

    let response: Response | null = null;
    try {
      response = await fetch(sessionsUri, { headers: myHeaders });
    } catch (fetchError) {
      // A complete network failure
      logger.error("Network error pulling in topic configuration", fetchError, {
        sessionsUri
      });
      response = null;
    }

    if (response === null) {
      return {
        sessions: null,
        error: "Unable to load topics (0001)",
        groups: [],
        configName: ""
      };
    }

    if (!response.ok) {
      // A bad response code
      logger.error("Bad status code loading topic configuration", {
        sessionsUri,
        response,
        statusCode: response.status
      });

      return {
        sessions: null,
        error: "Unable to load topics (0002)",
        groups: [],
        configName: ""
      };
    }

    let data: SessionPayload | LegacySessionPayload | null = null;
    try {
      data = await response.json();
    } catch (jsonError) {
      // Body payload invalid
      logger.error(
        "Response JSON error pulling in topic configuration",
        jsonError,
        {
          sessionsUri,
          response,
          statusCode: response.status
        }
      );
      data = null;
    }

    if (data === null) {
      return {
        sessions: null,
        error: "Unable to load topics (0003)",
        groups: [],
        configName: ""
      };
    }

    try {
      if (isModernPayload(data)) {
        const res = {
          sessions: data.sessions,
          error: null,
          groups: this._createGroups(data.groups, data.sessions),
          configName: data.name
        };
        logger.debug("Loaded topic configuration", res);
        return res;
      } else {
        const res = {
          sessions: data,
          error: null,
          groups: this._createGroups(null, data),
          configName: `legacy:${this.props.screenProps.brandingTitle}`
        };
        logger.debug("Loaded legacy topic configuration", res);
        return res;
      }
    } catch (error) {
      logger.error("Error processing in topic configuration", error, {
        sessionsUri,
        response,
        statusCode: response.status,
        data
      });
      return {
        sessions: null,
        error: "Unable to load topics (0004)",
        groups: [],
        configName: ""
      };
    }
  };

  pollSessionData = async () => {
    const { sessions, error, groups, configName } = await this._fetchContent(
      this.props.screenProps.sessionsUri
    );
    this.setState({
      sessionsList: sessions,
      errorMessage: error,
      isInitiallyLoading: false,
      groups,
      configName
    });

    this.lastTimeOutRef = setTimeout(this.pollSessionData, POLLLING_INTERVAL);
  };

  async componentDidMount() {
    const { sessions, error, groups, configName } = await this._fetchContent(
      this.props.screenProps.sessionsUri
    );

    this.setState({
      sessionsList: sessions,
      errorMessage: error,
      isInitiallyLoading: false,
      groups,
      configName
    });

    this.lastTimeOutRef = setTimeout(this.pollSessionData, POLLLING_INTERVAL);
  }

  async componentDidUpdate(prevProps: Readonly<Props>) {
    if (
      this.props.screenProps.sessionsUri !== prevProps.screenProps.sessionsUri
    ) {
      logger.debug("Refreshing topic configuration due to URI change");
      const { sessions, error, groups, configName } = await this._fetchContent(
        this.props.screenProps.sessionsUri
      );

      this.setState({
        sessionsList: sessions,
        errorMessage: error,
        isInitiallyLoading: false,
        groups,
        configName
      });
    }
  }

  componentWillUnmount() {
    if (this.lastTimeOutRef) {
      clearTimeout(this.lastTimeOutRef);
    }
  }

  renderSectionHeader = ({ section }: { section: GroupOutput }) => {
    if (section.title.length === 0) {
      return <></>;
    }

    const sessionIconSource: ImageSourcePropType = section.sectionIcon
      ? topicImages[section.sectionIcon]
      : null;
    return (
      <GroupTag>
        {section.sectionIcon ? (
          <Image
            source={sessionIconSource}
            style={styles.sectionIcon}
            resizeMode="contain"
          />
        ) : null}
        <SectionTitle>{section.title}</SectionTitle>
      </GroupTag>
    );
  };

  render() {
    const { isInitiallyLoading, errorMessage, loadingItems } = this.state;

    return (
      <>
        {errorMessage && (
          <CenteredContainer>
            <ErrorText error style={{ textAlign: "center" }}>
              {errorMessage}
            </ErrorText>
            <Button
              title="Reload Content"
              onPress={async () => {
                await this._fetchContent(this.props.screenProps.sessionsUri);
              }}
            />
          </CenteredContainer>
        )}
        {isInitiallyLoading ? (
          <FlatList
            data={loadingItems}
            keyExtractor={item => item.toString()}
            renderItem={this._renderLoadingItem}
          />
        ) : (
          <SectionList
            stickySectionHeadersEnabled={false}
            sections={this.state.groups}
            renderSectionHeader={({ section }) => {
              // HACK: unable to strongly type SectionList as SectionListStatic<GroupOutput>
              return this.renderSectionHeader({
                section: section as GroupOutput
              });
            }}
            renderItem={({ item }) => {
              return this._renderItem(item);
            }}
            keyExtractor={item => {
              return item.id;
            }}
            refreshing={this.state.isFetching}
            onRefresh={async () => {
              this.setState({ isFetching: true });
              const {
                sessions,
                error,
                groups,
                configName
              } = await this._fetchContent(this.props.screenProps.sessionsUri);
              this.setState({
                sessionsList: sessions,
                errorMessage: error,
                isFetching: false,
                groups,
                configName
              });
            }}
          />
        )}
      </>
    );
  }
}

const GroupTag = styled.View`
  margin-vertical: ${Metrics.baseMargin}px;
  flex-direction: row;
  align-items: center;
`;

const SectionTitle = styled.Text`
  font-size: ${Fonts.size.medium}px;
  font-weight: bold;
  align-items: center;
  justify-content: center;
`;

const CenteredContainer = styled.View`
  padding: ${Metrics.baseMargin}px;
`;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    padding: Metrics.baseMargin,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    marginBottom: Metrics.baseMargin
  },
  cardHeader: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  cardTitle: {
    flex: 1,
    flexDirection: "column",
    marginHorizontal: Metrics.baseMargin
  },
  titleText: {
    ...Fonts.style.sectionHeaderSmall,
    fontWeight: "bold",
    color: Colors.textDark
  },
  dateText: {
    ...Fonts.style.description,
    color: Colors.textGray
  },
  emptyText: {
    color: Colors.grayLighter,
    backgroundColor: Colors.grayLighter
  },
  iconImage: {
    width: Metrics.images.large,
    height: Metrics.images.large
  },
  sectionIcon: {
    width: Metrics.images.medium,
    height: Metrics.images.medium
  }
});

export default withNavigation(TopicsList);
