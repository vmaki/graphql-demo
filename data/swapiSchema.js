/**
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLEnumType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString
} from 'graphql';

import { makeExecutableSchema } from 'graphql-tools';

import { PubSub, SubscriptionManager, withFilter } from 'graphql-subscriptions';
import {schemaString} from './marvel';

const pubsub = new PubSub();
const ADDED_REVIEW_TOPIC = 'new_review';

/**
 * This defines a basic set of data for our Star Wars Schema.
 *
 * This data is hard coded for the sake of the demo, but you could imagine
 * fetching this data from a backend service rather than from hardcoded
 * JSON objects in a more complex demo.
 */

const humans = [
  {
    id: '1000', title: '美国队长', name: '斯蒂夫·罗杰斯', gender: '先生', height: 188, 
    friends: [ '1001','1002','1003','2001' ], appearsIn: [ 'CaptainAmerica', 'Avengers' ],
  },
  {
    id: '1001', title: '钢铁侠', name: ' 托尼·斯塔克', gender: '先生', height: 185,
    friends: [ '1000','1002','1007','2001' ], appearsIn: [ 'IronMan', 'Avengers', 'CaptainAmerica' ],
  },
  {
    id: '1002', title: '黑寡妇', name: '娜塔莎·罗曼诺夫', gender: '女士', height: null,
    friends: [ '1000','1001','2001' ], appearsIn: [ 'Avengers' ],
  },
  {
    id: '1003', title: '金刚狼', name: '罗根', gender: '先生', height: 166,
    friends: [ '1000','1005' ], appearsIn: [ 'Wolverine','XMen' ],
  },
  {
    id: '1004', title: '镭射眼', name: ' 斯科特·萨默斯', gender: '先生', height: 191,
    friends: ['1005' ], appearsIn: [ 'XMen' ],
  },
  {
    id: '1005', title: '凤凰女', name: '琴·葛蕾', gender: '女士', height: 168,
    friends: [ '1003','1004' ], appearsIn: [ 'XMen' ],
  },
  {
    id: '1006', title: '星爵', name: '彼得·杰森·奎尔', gender: '先生', height: 192,
    friends: [ '2002' ], appearsIn: [ 'GuardiansOfTheGalaxy', 'Avengers' ],
  },
  {
    id: '1007', title: '蜘蛛侠', name: '彼得·帕克', gender: '先生', height: 177,
    friends: [ '1001' ], appearsIn: [ 'Avengers' ],
  },
  {
    id: '1008', title: '绿巨人', name: '布鲁斯·班纳', gender: '先生', height: null,
    friends: [ '1000','1001','1002','2001' ], appearsIn: [ 'Avengers' ],
  },
  {
    id: '1009', title: '万磁王', name: '埃里克·兰谢尔', gender: '先生', height: 188,
    friends: [  ], appearsIn: [ 'XMen' ],
  }
];

const humanData = {};
humans.forEach((ship) => {
  humanData[ship.id] = ship;
});

const aliens = [
  {
    id: '2001', title: '雷神', name: '索尔·奥丁森', homePlanet: '阿斯加德',
    friends: [ '1000','1001','1002','1008', ],
    appearsIn: [ 'Thor', 'Avengers' ]
  },
  {
    id: '2002', title: '卡魔拉', name: '卡魔拉·贞·忽贝莉·本·泰坦', homePlanet: '泽侯贝里族',
    friends: [ '1006' ],
    appearsIn: [ 'GuardiansOfTheGalaxy', 'Avengers' ]
  }
];

const alienData = {};
aliens.forEach((ship) => {
  alienData[ship.id] = ship;
});

var reviews = {
  'Avengers': [],
  'XMen': [],
  'GuardiansOfTheGalaxy': [],
  'IronMan': [],
  'CaptainAmerica': [],
  'Thor': []
};


/**
 * Helper function to get a character by ID.
 */
function getCharacter(id) {
  // Returning a promise just to illustrate GraphQL.js's support.
  return Promise.resolve(humanData[id] || alienData[id]);
}

function sayHi(name) {
  if(!name) {
    name = 'World';
  }

  return `Hello ${name}`;
}

/**
 * Allows us to query for a character's friends.
 */
function getFriends(character) {
  return character.friends.map(id => getCharacter(id));
}

/**
 * Allows us to fetch the undisputed hero of the Star Wars trilogy, R2-D2.
 */
function getHero(episode) {
  if (episode === 'Avengers') {
    return humanData['1000'];
  } else if (episode === 'XMen') {
    return humanData['1009'];
  } else if (episode === 'GuardiansOfTheGalaxy') {
    return humanData['1006'];
  } else if (episode === 'IronMan') {
    return humanData['1001'];
  } else if (episode === 'CaptainAmerica') {
    return humanData['1000'];
  } else {
    alienData['2001']
  };
}

/**
 * Allows us to fetch the ephemeral reviews for each episode
 */
function getReviews(episode) {
  return reviews[episode];
}

/**
 * Allows us to query for the human with the given id.
 */
function getHuman(id) {
  return humanData[id];
}

/**
 * Allows us to query for the alien with the given id.
 */
function getAlien(id) {
  return alienData[id];
}

function toCursor(str) {
  return Buffer("cursor" + str).toString('base64');
}

function fromCursor(str) {
  return Buffer.from(str, 'base64').toString().slice(6);
}

const resolvers = {
  Query: {
    hero: (root, { episode }) => getHero(episode),
    character: (root, { id }) => getCharacter(id),
    hi: (root, { name }) => sayHi(name),
    human: (root, { id }) => getHuman(id),
    alien: (root, { id }) => getAlien(id),
    reviews: (root, { episode }) => getReviews(episode),
    search: (root, { text }) => {
      const re = new RegExp(text, 'i');

      const allData = [
        ...humans,
        ...aliens,
      ];

      return allData.filter((obj) => re.test(obj.name));
    },
  },
  Mutation: {
    createReview: (root, { episode, review }) => {
      reviews[episode].push(review);
      review.episode = episode;
      pubsub.publish(ADDED_REVIEW_TOPIC, {reviewAdded: review});
      return review;
    },
  },
  Subscription: {
    reviewAdded: {
        subscribe: withFilter(
            () => pubsub.asyncIterator(ADDED_REVIEW_TOPIC),
            (payload, variables) => {
                return (payload !== undefined) && 
                ((variables.episode === null) || (payload.reviewAdded.episode === variables.episode));
            }
        ),
    },
  },
  Character: {
    __resolveType(data, context, info){
      if(humanData[data.id]){
        return info.schema.getType('Human');
      }
      if(alienData[data.id]){
        return info.schema.getType('Alien');
      }
      return null;
    },
  },
  Human: {
    gender: ({ gender }, { unit }) => {
      if (unit === 'Sex') {
        return (gender === '先生') ? '男' : '女';
      }

      return gender;
    },
    friends: ({ friends }) => friends.map(getCharacter),
    friendsConnection: ({ friends }, { first, after }) => {
      first = first || friends.length;
      after = after ? parseInt(fromCursor(after), 10) : 0;
      const edges = friends.map((friend, i) => ({
        cursor: toCursor(i+1),
        node: getCharacter(friend)
      })).slice(after, first + after);
      const slicedFriends = edges.map(({ node }) => node);
      return {
        edges,
        friends: slicedFriends,
        pageInfo: {
          startCursor: edges.length > 0 ? edges[0].cursor : null,
          hasNextPage: first + after < friends.length,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null
        },
        totalCount: friends.length
      };
    },
    appearsIn: ({ appearsIn }) => appearsIn,
  },
  Alien: {
    friends: ({ friends }) => friends.map(getCharacter),
    friendsConnection: ({ friends }, { first, after }) => {
      first = first || friends.length;
      after = after ? parseInt(fromCursor(after), 10) : 0;
      const edges = friends.map((friend, i) => ({
        cursor: toCursor(i+1),
        node: getCharacter(friend)
      })).slice(after, first + after);
      const slicedFriends = edges.map(({ node }) => node);
      return {
        edges,
        friends: slicedFriends,
        pageInfo: {
          startCursor: edges.length > 0 ? edges[0].cursor : null,
          hasNextPage: first + after < friends.length,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null
        },
        totalCount: friends.length
      };
    },
    appearsIn: ({ appearsIn }) => appearsIn,
  },
  FriendsConnection: {
    edges: ({ edges }) => edges,
    friends: ({ friends }) => friends,
    pageInfo: ({ pageInfo }) => pageInfo,
    totalCount: ({ totalCount }) => totalCount,
  },
  FriendsEdge: {
    node: ({ node }) => node,
    cursor: ({ cursor }) => cursor,
  },
  SearchResult: {
    __resolveType(data, context, info){
      if(humanData[data.id]){
        return info.schema.getType('Human');
      }
      if(alienData[data.id]){
        return info.schema.getType('Alien');
      }
      return null;
    },
  },
}

/**
 * Finally, we construct our schema (whose starting query type is the query
 * type we defined above) and export it.
 */
export const StarWarsSchema = makeExecutableSchema({
  typeDefs: [schemaString],
  resolvers
});
