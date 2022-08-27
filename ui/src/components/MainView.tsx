// Copyright (c) 2022 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useMemo, useState, useEffect } from 'react';
import { Container, Grid, Header, Icon, Segment, Divider, Button, Input } from 'semantic-ui-react';
import { Party } from '@daml/types';
import { useLedger, useStreamQueries } from "@daml/react";
import { User as mainUser } from '@daml.js/token-demo';
import { BondToken } from "@daml.js/token-demo";
import { BondApplication } from "@daml.js/token-demo";
import { BondType } from '@daml.js/token-demo/lib/BondToken';
import { publicContext, userContext } from './App';
import UserList from './UserList';
import PartyListEdit from './PartyListEdit';
import MessageEdit from './MessageEdit';
import MessageList from './MessageList';
import BondTokenList from './BondTokenList';
import BondApplicationList from "./BondApplicationList";
import { withUserManagement } from "../config";
import { encode } from 'jwt-simple';
import Ledger, { CanReadAs } from '@daml/ledger';

interface UnderwriterType {
  username: Party;
  alias: string;
};

const MainView: React.FC = () => {
  const [bondname, setBondname] = useState("")
  const [bondprice, setBondprice] = useState("")
  const [bondqty, setBondqty] = useState("")
  const [theunderwriterObj, setTheUnderwriterObj] = useState<UnderwriterType|undefined>(undefined);

  const party = userContext.useParty();

  //const mainUserFats = useStreamQueries(mainUser);
  //console.log(mainUserFats.contracts)
  //const fixedRateBondFacts = useStreamQueries(BondApplication);
  //console.log(fixedRateBondFacts.contracts)

  const price = "Price"
  const quantity = "Quantity"
  const name = "Bondname"

// USERS_BEGIN
  const username = userContext.useParty();
  const myUserResult = userContext.useStreamFetchByKeys(mainUser.User, () => [username], [username]);
  const aliases = publicContext.useStreamQueries(mainUser.Alias, () => [], []);
  const myUser = myUserResult.contracts[0]?.payload;
  const allUsers = userContext.useStreamQueries(mainUser.User).contracts;
// USERS_END

  const allBondTokens = userContext.useStreamQueries(BondToken.BondToken).contracts;
  const theBondTokens = useMemo(() => 
    allBondTokens.map(bonds => bonds.payload),
    [allBondTokens, username]);

  const allBondApplications = userContext.useStreamQueries(
    BondToken.BondApplication
  ).contracts;
  const theBondApplications = useMemo(
    () => allBondApplications.map((bonds) => bonds.payload),
    [allBondApplications, username]
  );

  // Sorted list of users that are following the current user
  const followers = useMemo(() =>
    allUsers
    .map(user => user.payload)
    .filter(user => user.username !== username)
    .sort((x, y) => x.username.localeCompare(y.username)),
    [allUsers, username]);

  // get underwriter username from underwriter alias
  const ledgerId: string = process.env.REACT_APP_LEDGER_ID ?? "token-demo-sandbox"
  const theunderwriterAlias = "bank"
  const getUnderwriter = async(): Promise<string> => {
    const payload1 = withUserManagement.tokenPayload(theunderwriterAlias, ledgerId);
    const token1 = encode(payload1, "secret", "HS256");
    const ledgerLogin1 = new Ledger({ token: token1 });
    const underwriter: string = await withUserManagement.primaryParty(theunderwriterAlias, ledgerLogin1);
    console.log(underwriter)

    setTheUnderwriterObj({username:underwriter,alias:theunderwriterAlias})
    return underwriter
  }
  useEffect(() => {
    getUnderwriter()
  }, [])

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

  const doIssue =  async ( params: any, contract: any = null) => {
    const payload = {
      price: params.Price,
      quantity: params.Quantity,
      bondname: params.Bondname
    }
    console.log(payload)
    try {
      //let bondContract = await ledger.fetchByKey(BondToken.BondApplication, party);
      //if (bondContract === null) {
        let bondType : BondType = "Vanilla"
        const token = {issuer: party, underwriter: party, name: params.Bondname, currency: "SGD", bondType: bondType};
        let bondContract = await ledger.create(BondToken.BondApplication, token);
      //}
      //await ledger.exerciseByKey(BondToken.BondApplication.IssueBond, username, payload);
    } catch(error) {
      alert(`Unknown error:\n${JSON.stringify(error)}`);
    }
  };

  const handleIssue = async () => {
    console.log('handleIssue')
    const params = {
      Price: bondprice,
      Quantity: bondqty,
      Bondname: bondname
    }
    await doIssue(params)
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
                  Bonds<br></br>
                  <Input placeholder='name' id="bondname" onChange={(e) => setBondname(e.target.value)}/>
                  <Input placeholder='price' id="bondprice" onChange={(e) => setBondprice(e.target.value)}/>
                  <Input placeholder='quantity' id="quantity" onChange={(e) => setBondqty(e.target.value)}/>
                  <Header.Subheader><Button onClick={handleIssue}>Issue</Button> </Header.Subheader>
                </Header.Content>
              </Header>
              <Divider />
              <Header as='h2'>
                <Header.Content>
                  <Header.Subheader>All Bond Applications </Header.Subheader>
                </Header.Content>
                <BondApplicationList bondApplications={theBondApplications} />
              </Header>
              <Divider />
              <Header as='h2'>
                <Header.Content>
                  <Header.Subheader>Successful Applications </Header.Subheader>
                </Header.Content>
                <BondTokenList bondTokens={theBondTokens} />
              </Header>
              <Divider />
              <Header as='h2'>
                <Header.Content>
                  <Header.Subheader>Declined Applications </Header.Subheader>
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
