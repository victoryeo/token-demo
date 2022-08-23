// Copyright (c) 2022 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useMemo } from 'react';
import { Container, Grid, Header, Icon, Segment, Divider, Button } from 'semantic-ui-react';
import { Party } from '@daml/types';
import { useLedger, useStreamQueries } from "@daml/react";
import { User as mainUser } from '@daml.js/token-demo';
import { BondToken } from "@daml.js/token-demo";
import { publicContext, userContext } from './App';
import UserList from './UserList';
import PartyListEdit from './PartyListEdit';
import MessageEdit from './MessageEdit';
import MessageList from './MessageList';

// USERS_BEGIN
const MainView: React.FC = () => {
  const mainUserFats = useStreamQueries(mainUser);
  console.log(mainUserFats.contracts)
  const fixedRateBondFacts = useStreamQueries(BondToken);
  console.log(fixedRateBondFacts.contracts)

  const price = "Price"
  const quantity = "Quantity"

  const doIssue =  async (contract: any, params: any) => {
    const payload = {
      price: params[price],
      quantity: params[quantity],
    }
    await ledger.exerciseByKey(BondToken.BondApplication.IssueBond, contract.contractId, payload);
  };

  const username = userContext.useParty();
  const myUserResult = userContext.useStreamFetchByKeys(mainUser.User, () => [username], [username]);
  const aliases = publicContext.useStreamQueries(mainUser.Alias, () => [], []);
  const myUser = myUserResult.contracts[0]?.payload;
  const allUsers = userContext.useStreamQueries(mainUser.User).contracts;
// USERS_END

  // Sorted list of users that are following the current user
  const followers = useMemo(() =>
    allUsers
    .map(user => user.payload)
    .filter(user => user.username !== username)
    .sort((x, y) => x.username.localeCompare(y.username)),
    [allUsers, username]);

  // Map to translate party identifiers to aliases.
  const partyToAlias = useMemo(() =>
    new Map<Party, string>(aliases.contracts.map(({payload}) => [payload.username, payload.alias])),
    [aliases]
  );
  const myUserName = aliases.loading ? 'loading ...' : partyToAlias.get(username) ?? username;

  // FOLLOW_BEGIN
  const ledger = userContext.useLedger();

  const follow = async (userToFollow: Party): Promise<boolean> => {
    try {
      await ledger.exerciseByKey(mainUser.User.Follow, username, {userToFollow});
      return true;
    } catch (error) {
      alert(`Unknown error:\n${JSON.stringify(error)}`);
      return false;
    }
  }
  // FOLLOW_END

  const handleIssue = async () => {
    console.log('handleIssue')
    const params = {
      price: 100.0,
      quantity: 10
    }
    fixedRateBondFacts.contracts.map(c => {doIssue(c.contractId, params)})
  }

  return (
    <Container>
      <Grid centered columns={2}>
        <Grid.Row stretched>
          <Grid.Column>
            <Header as='h1' size='huge' color='blue' textAlign='center' style={{padding: '1ex 0em 0ex 0em'}}>
                {myUserName ? `Welcome, ${myUserName}!` : 'Loading...'}
            </Header>

            <Segment>
              <Header as='h2'>
                <Header.Content>
                  Bonds
                  <Header.Subheader><Button onClick={handleIssue}>Issue</Button> </Header.Subheader>
                </Header.Content>
              </Header>
              <Divider />
              <Header as='h2'>
                <Header.Content>
                  <Header.Subheader>Applications </Header.Subheader>
                </Header.Content>
              </Header>
              <Divider />
              <Header as='h2'>
                <Header.Content>
                  <Header.Subheader>Declined Applications </Header.Subheader>
                </Header.Content>
              </Header>
              <Divider />
              <Header as='h2'>
                <Header.Content>
                  <Header.Subheader>Approved Applications </Header.Subheader>
                </Header.Content>
              </Header>
            </Segment>

            <Segment>
              <Header as='h2'>
                <Icon name='user' />
                <Header.Content>
                  {myUserName ?? 'Loading...'}
                  <Header.Subheader>Users I'm following</Header.Subheader>
                </Header.Content>
              </Header>
              <Divider />
              <PartyListEdit
                parties={myUser?.following ?? []}
                partyToAlias={partyToAlias}
                onAddParty={follow}
              />
            </Segment>
            <Segment>
              <Header as='h2'>
                <Icon name='globe' />
                <Header.Content>
                  The Network
                  <Header.Subheader>My followers and users they are following</Header.Subheader>
                </Header.Content>
              </Header>
              <Divider />
              {/* USERLIST_BEGIN */}
              <UserList
                users={followers}
                partyToAlias={partyToAlias}
                onFollow={follow}
              />
              {/* USERLIST_END */}
            </Segment>
            <Segment>
              <Header as='h2'>
                <Icon name='pencil square' />
                <Header.Content>
                  Messages
                  <Header.Subheader>Send a message to a follower</Header.Subheader>
                </Header.Content>
              </Header>
              <MessageEdit
                followers={followers.map(follower => follower.username)}
                partyToAlias={partyToAlias}
              />
              <Divider />
              <MessageList partyToAlias={partyToAlias}/>
            </Segment>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Container>
  );
}

export default MainView;
