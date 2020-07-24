const Marvel = `
schema {
  query: Query
  mutation: Mutation
  subscription: Subscription
}

# 查询
type Query {
  hero(episode: Episode): Character
  reviews(episode: Episode!): [Review]
  search(text: String): [SearchResult]
  character(id: ID!): Character
  alien(id: ID!): Alien
  human(id: ID!): Human
  hi(name: String): String
}

# 更新
type Mutation {
  createReview(episode: Episode, review: ReviewInput!): Review
}

# 订阅
type Subscription {
  reviewAdded(episode: Episode): Review
}

# 剧集
enum Episode {
  Avengers # 复仇者联盟
  XMen # X战警
  GuardiansOfTheGalaxy # 银河护卫队

  IronMan # 钢铁侠
  CaptainAmerica # 美国队长
  Thor # 雷神
}

# 角色的基本属性
interface Character {
  id: ID!
  title: String!
  name: String!
  appearsIn: [Episode]!

  friends: [Character]
  friendsConnection(first: Int, after: ID): FriendsConnection!
}

# 性别单位
enum GenderUnit {
  Sex
  Gender
}

# 人类
type Human implements Character {
  id: ID!
  title: String!
  name: String!
  appearsIn: [Episode]!

  friends: [Character]
  friendsConnection(first: Int, after: ID): FriendsConnection!
  
  gender(unit: GenderUnit = Gender): String
  height: Float
}

# 外星人
type Alien implements Character {
  id: ID!
  title: String!
  name: String!
  appearsIn: [Episode]!

  friends: [Character]
  friendsConnection(first: Int, after: ID): FriendsConnection!

  homePlanet: String
}

# A connection object for a character's friends
type FriendsConnection {
  # The total number of friends
  totalCount: Int

  # The edges for each of the character's friends.
  edges: [FriendsEdge]

  # A list of the friends, as a convenience when edges are not needed.
  friends: [Character]

  # Information for paginating this connection
  pageInfo: PageInfo!
}

# An edge object for a character's friends
type FriendsEdge {
  # A cursor used for pagination
  cursor: ID!

  # The character represented by this friendship edge
  node: Character
}

# Information for paginating this connection
type PageInfo {
  startCursor: ID
  endCursor: ID
  hasNextPage: Boolean!
}

# 评论
type Review {
  episode: Episode
  stars: Int!
  commentary: String
}

input ReviewInput {
  stars: Int!
  commentary: String
  favorite_color: ColorInput
}

input ColorInput {
  red: Int!
  green: Int!
  blue: Int!
}

union SearchResult = Human | Alien
`;

export const schemaString = Marvel
